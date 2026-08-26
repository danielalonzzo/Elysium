'use strict';

const express = require('express');

const RESEARCH_COLLECTION = 'research_notebooks';
const RESEARCH_LOCALES = new Set(['en', 'es', 'pt']);
const RESEARCH_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

class ResearchRouteError extends Error {
  constructor(message, code, status = 400) {
    super(message);
    this.name = 'ResearchRouteError';
    this.code = code;
    this.status = status;
  }
}

function researchLocale(value) {
  const locale = String(value || 'en').trim().toLowerCase();
  if (!RESEARCH_LOCALES.has(locale)) {
    throw new ResearchRouteError(
      'locale must be one of en, es or pt.',
      'research_locale_invalid'
    );
  }
  return locale;
}

function researchSlug(value) {
  const slug = String(value || '').trim();
  if (!slug || slug.length > 120 || !RESEARCH_SLUG.test(slug)) {
    throw new ResearchRouteError(
      'The research slug is invalid.',
      'research_slug_invalid'
    );
  }
  return slug;
}

function timestampIso(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
}

function integerOrder(value) {
  return Number.isInteger(value) ? value : 0;
}

function publicNotebook(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    schemaVersion: data.schemaVersion,
    slug: data.slug,
    title: data.title,
    description: data.description,
    coverUrl: data.coverUrl,
    coverPath: data.coverPath,
    coverAlt: data.coverAlt,
    locale: data.locale,
    order: integerOrder(data.order),
    publishedAt: timestampIso(data.publishedAt),
    updatedAt: timestampIso(data.updatedAt)
  };
}

function publicArticle(snapshot, { includeContent = true } = {}) {
  const data = snapshot.data();
  const article = {
    id: snapshot.id,
    schemaVersion: data.schemaVersion,
    notebookId: data.notebookId,
    slug: data.slug,
    title: data.title,
    author: data.author,
    excerpt: data.excerpt,
    coverUrl: data.coverUrl,
    coverPath: data.coverPath,
    coverAlt: data.coverAlt,
    locale: data.locale,
    order: integerOrder(data.order),
    publishedAt: timestampIso(data.publishedAt),
    updatedAt: timestampIso(data.updatedAt)
  };
  if (includeContent) {
    article.contentHtml = data.contentHtml;
    article.contentMarkdown = data.contentMarkdown;
  }
  return article;
}

function ordered(items) {
  return items.sort((left, right) => (
    integerOrder(left.order) - integerOrder(right.order)
    || String(left.title || '').localeCompare(String(right.title || ''), 'en')
  ));
}

function publishedQuery(collection, locale) {
  return collection
    .where('status', '==', 'published')
    .where('visibility', '==', 'public')
    .where('locale', '==', locale);
}

async function listPublicNotebooks(db, locale) {
  const result = await publishedQuery(db.collection(RESEARCH_COLLECTION), locale).get();
  return ordered(result.docs.map(publicNotebook));
}

async function findPublicNotebook(db, slug, locale) {
  const result = await publishedQuery(db.collection(RESEARCH_COLLECTION), locale)
    .where('slug', '==', slug)
    .limit(2)
    .get();
  if (result.empty) {
    throw new ResearchRouteError('Research notebook not found.', 'research_notebook_not_found', 404);
  }
  if (result.docs.length > 1) {
    // Firestore Rules cannot enforce uniqueness across documents. Failing
    // closed makes a race in the CRM visible instead of serving arbitrary data.
    throw new ResearchRouteError('The notebook slug is ambiguous.', 'research_slug_conflict', 409);
  }
  return result.docs[0];
}

async function listPublicArticles(notebookSnapshot, locale) {
  const result = await publishedQuery(notebookSnapshot.ref.collection('articles'), locale).get();
  return ordered(
    result.docs
      .filter(snapshot => snapshot.data().notebookId === notebookSnapshot.id)
      .map(snapshot => publicArticle(snapshot, { includeContent: false }))
  );
}

async function findPublicArticle(notebookSnapshot, slug, locale) {
  const result = await publishedQuery(notebookSnapshot.ref.collection('articles'), locale)
    .where('slug', '==', slug)
    .limit(2)
    .get();
  const matches = result.docs.filter(
    snapshot => snapshot.data().notebookId === notebookSnapshot.id
  );
  if (matches.length === 0) {
    throw new ResearchRouteError('Research article not found.', 'research_article_not_found', 404);
  }
  if (matches.length > 1) {
    throw new ResearchRouteError('The article slug is ambiguous.', 'research_slug_conflict', 409);
  }
  return matches[0];
}

function asyncRoute(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response)).catch(next);
}

function createResearchRouter({ db, logger = console } = {}) {
  if (!db || typeof db.collection !== 'function') {
    throw new TypeError('createResearchRouter requires a Firestore database.');
  }

  const router = express.Router();

  router.get('/notebooks', asyncRoute(async (request, response) => {
    const locale = researchLocale(request.query.locale);
    const items = await listPublicNotebooks(db, locale);
    response.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
    response.json({ items, count: items.length, locale });
  }));

  router.get('/notebooks/:notebookSlug/articles/:articleSlug', asyncRoute(async (request, response) => {
    const locale = researchLocale(request.query.locale);
    const notebookSnapshot = await findPublicNotebook(
      db,
      researchSlug(request.params.notebookSlug),
      locale
    );
    const articleSnapshot = await findPublicArticle(
      notebookSnapshot,
      researchSlug(request.params.articleSlug),
      locale
    );
    response.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
    response.json({
      notebook: publicNotebook(notebookSnapshot),
      article: publicArticle(articleSnapshot)
    });
  }));

  router.get('/notebooks/:notebookSlug/articles', asyncRoute(async (request, response) => {
    const locale = researchLocale(request.query.locale);
    const notebookSnapshot = await findPublicNotebook(
      db,
      researchSlug(request.params.notebookSlug),
      locale
    );
    const items = await listPublicArticles(notebookSnapshot, locale);
    response.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
    response.json({
      notebook: publicNotebook(notebookSnapshot),
      items,
      count: items.length,
      locale
    });
  }));

  router.get('/notebooks/:notebookSlug', asyncRoute(async (request, response) => {
    const locale = researchLocale(request.query.locale);
    const notebookSnapshot = await findPublicNotebook(
      db,
      researchSlug(request.params.notebookSlug),
      locale
    );
    response.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
    response.json({ notebook: publicNotebook(notebookSnapshot) });
  }));

  router.use((error, _request, response, _next) => {
    if (error instanceof ResearchRouteError) {
      response.set('Cache-Control', 'no-store');
      return response.status(error.status).json({ error: error.message, code: error.code });
    }
    logger.error('[research] public read failed:', error?.message || error);
    response.set('Cache-Control', 'no-store');
    return response.status(503).json({
      error: 'Research is temporarily unavailable.',
      code: 'research_unavailable'
    });
  });

  return router;
}

module.exports = {
  RESEARCH_COLLECTION,
  ResearchRouteError,
  createResearchRouter,
  findPublicArticle,
  findPublicNotebook,
  listPublicArticles,
  listPublicNotebooks,
  publicArticle,
  publicNotebook,
  researchLocale,
  researchSlug,
  timestampIso
};
