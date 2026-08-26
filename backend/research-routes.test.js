'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { createResearchRouter, researchLocale, researchSlug } = require('./research-routes');

class FakeTimestamp {
  constructor(iso) {
    this.value = new Date(iso);
  }

  toDate() {
    return this.value;
  }
}

class FakeSnapshot {
  constructor(id, data, children = {}) {
    this.id = id;
    this.value = data;
    this.children = children;
    this.ref = {
      collection: name => new FakeQuery(this.children[name] || [])
    };
  }

  data() {
    return this.value;
  }
}

class FakeQuery {
  constructor(docs, filters = [], maximum = Infinity) {
    this.docs = docs;
    this.filters = filters;
    this.maximum = maximum;
  }

  where(field, operator, expected) {
    assert.equal(operator, '==');
    return new FakeQuery(this.docs, [...this.filters, [field, expected]], this.maximum);
  }

  limit(maximum) {
    return new FakeQuery(this.docs, this.filters, maximum);
  }

  async get() {
    const docs = this.docs
      .filter(snapshot => this.filters.every(
        ([field, expected]) => snapshot.data()[field] === expected
      ))
      .slice(0, this.maximum);
    return { docs, empty: docs.length === 0 };
  }
}

function researchFixture() {
  const stamp = new FakeTimestamp('2026-08-20T10:00:00.000Z');
  const commonArticle = {
    schemaVersion: 1,
    author: 'Elysium Research',
    excerpt: 'A concise abstract.',
    coverUrl: '',
    coverPath: '',
    coverAlt: '',
    locale: 'en',
    visibility: 'public',
    order: 2,
    contentHtml: '<h2>Evidence</h2><p>Result.</p>',
    contentMarkdown: '## Evidence\n\nResult.',
    publishedAt: stamp,
    updatedAt: stamp,
    createdBy: 'private-admin-uid',
    updatedBy: 'private-admin-uid'
  };
  const articles = [
    new FakeSnapshot('article-1', {
      ...commonArticle,
      notebookId: 'notebook-1',
      slug: 'first-result',
      title: 'First result',
      status: 'published'
    }),
    new FakeSnapshot('article-draft', {
      ...commonArticle,
      notebookId: 'notebook-1',
      slug: 'draft-result',
      title: 'Draft result',
      status: 'draft'
    }),
    new FakeSnapshot('article-orphan', {
      ...commonArticle,
      notebookId: 'another-notebook',
      slug: 'orphan-result',
      title: 'Orphan result',
      status: 'published'
    })
  ];
  const commonNotebook = {
    schemaVersion: 1,
    description: 'Notebook description.',
    coverUrl: '',
    coverPath: '',
    coverAlt: '',
    visibility: 'public',
    order: 4,
    publishedAt: stamp,
    updatedAt: stamp,
    createdBy: 'private-admin-uid',
    updatedBy: 'private-admin-uid'
  };
  const notebooks = [
    new FakeSnapshot('notebook-1', {
      ...commonNotebook,
      slug: 'artificial-intelligence',
      title: 'Artificial Intelligence',
      locale: 'en',
      status: 'published'
    }, { articles }),
    new FakeSnapshot('notebook-draft', {
      ...commonNotebook,
      slug: 'private-notes',
      title: 'Private notes',
      locale: 'en',
      status: 'draft'
    }),
    new FakeSnapshot('notebook-es', {
      ...commonNotebook,
      slug: 'inteligencia-artificial',
      title: 'Inteligencia Artificial',
      locale: 'es',
      status: 'published'
    })
  ];
  return { collection: name => new FakeQuery(name === 'research_notebooks' ? notebooks : []) };
}

async function withResearchServer(run) {
  const app = express();
  app.use('/api/research', createResearchRouter({
    db: researchFixture(),
    logger: { error() {} }
  }));
  const server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  try {
    const address = server.address();
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    if (server.listening) {
      await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  }
}

test('validates the locale and canonical slug accepted by the data contract', () => {
  assert.equal(researchLocale(), 'en');
  assert.equal(researchLocale('ES'), 'es');
  assert.equal(researchSlug('first-result'), 'first-result');
  assert.throws(() => researchLocale('fr'), /en, es or pt/);
  assert.throws(() => researchSlug('../draft'), /invalid/);
  assert.throws(() => researchSlug('Not-Canonical'), /invalid/);
});

test('lists only published public notebooks and strips audit identifiers', async () => {
  await withResearchServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/research/notebooks?locale=en`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('cache-control'), /s-maxage=300/);
    const body = await response.json();
    assert.equal(body.count, 1);
    assert.equal(body.items[0].slug, 'artificial-intelligence');
    assert.equal(body.items[0].publishedAt, '2026-08-20T10:00:00.000Z');
    assert.equal('createdBy' in body.items[0], false);
    assert.equal('status' in body.items[0], false);
  });
});

test('article cards omit bodies while the detail route returns both clean formats', async () => {
  await withResearchServer(async baseUrl => {
    const listResponse = await fetch(
      `${baseUrl}/api/research/notebooks/artificial-intelligence/articles?locale=en`
    );
    assert.equal(listResponse.status, 200);
    const list = await listResponse.json();
    assert.equal(list.count, 1);
    assert.equal(list.items[0].slug, 'first-result');
    assert.equal('contentHtml' in list.items[0], false);

    const detailResponse = await fetch(
      `${baseUrl}/api/research/notebooks/artificial-intelligence/articles/first-result?locale=en`
    );
    assert.equal(detailResponse.status, 200);
    const detail = await detailResponse.json();
    assert.equal(detail.article.contentHtml, '<h2>Evidence</h2><p>Result.</p>');
    assert.equal(detail.article.contentMarkdown, '## Evidence\n\nResult.');
    assert.equal(detail.article.author, 'Elysium Research');

    const draftResponse = await fetch(
      `${baseUrl}/api/research/notebooks/artificial-intelligence/articles/draft-result?locale=en`
    );
    assert.equal(draftResponse.status, 404);
    assert.equal((await draftResponse.json()).code, 'research_article_not_found');
  });
});

test('rejects invalid locales before querying and never caches the error', async () => {
  await withResearchServer(async baseUrl => {
    const response = await fetch(`${baseUrl}/api/research/notebooks?locale=fr`);
    assert.equal(response.status, 400);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await response.json()).code, 'research_locale_invalid');
  });
});
