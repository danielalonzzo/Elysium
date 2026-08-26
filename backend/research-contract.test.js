'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { RESEARCH_COLLECTION } = require('./research-routes');

const ROOT = join(__dirname, '..');
const firestoreRules = readFileSync(join(ROOT, 'firestore.rules'), 'utf8');
const storageRules = readFileSync(join(ROOT, 'storage.rules'), 'utf8');
const indexes = JSON.parse(readFileSync(join(ROOT, 'firestore.indexes.json'), 'utf8'));
const openapi = JSON.parse(readFileSync(join(ROOT, 'openapi.json'), 'utf8'));

test('Firestore, the backend and OpenAPI share the canonical collection name', () => {
  assert.equal(RESEARCH_COLLECTION, 'research_notebooks');
  assert.match(firestoreRules, /match \/research_notebooks\/\{notebookId\}/);
  assert.match(
    firestoreRules,
    /match \/research_notebooks\/\{notebookId\}[\s\S]*match \/articles\/\{articleId\}/
  );
  assert.deepEqual(
    Object.keys(openapi.paths).filter(path => path.startsWith('/api/research')).sort(),
    [
      '/api/research/notebooks',
      '/api/research/notebooks/{notebookSlug}',
      '/api/research/notebooks/{notebookSlug}/articles',
      '/api/research/notebooks/{notebookSlug}/articles/{articleSlug}'
    ]
  );
});

test('the public rule gates both resources on published and public state', () => {
  const researchMatch = firestoreRules.slice(firestoreRules.indexOf('match /research_notebooks/'));
  assert.match(researchMatch, /resource\.data\.status == 'published'/);
  assert.match(researchMatch, /resource\.data\.visibility == 'public'/);
  assert.match(
    researchMatch,
    /get\(\/databases\/\$\(database\)\/documents\/research_notebooks\/\$\(notebookId\)\)\.data\.status/
  );
  assert.match(researchMatch, /allow create: if researchCanManage\(\)/);
  assert.doesNotMatch(researchMatch, /allow (create|update|write): if true/);
});

test('editor bodies are not indexed and cover uploads use the documented limits', () => {
  const disabled = indexes.fieldOverrides
    .filter(item => item.collectionGroup === 'articles' && item.indexes.length === 0)
    .map(item => item.fieldPath)
    .sort();
  assert.deepEqual(disabled, ['contentHtml', 'contentMarkdown']);
  assert.match(storageRules, /research\/notebooks\/\{notebookId\}\/cover\/\{fileName\}/);
  assert.match(storageRules, /request\.resource\.size <= 5 \* 1024 \* 1024/);
  assert.match(storageRules, /image\/\(jpeg\|png\|webp\)/);
  assert.doesNotMatch(storageRules, /image\/\([^)]*(avif|gif)/);
});

test('the OpenAPI article schema carries every public editor field', () => {
  const card = openapi.components.schemas.ResearchArticleCard;
  const required = new Set(card.required);
  for (const field of [
    'id', 'notebookId', 'slug', 'title', 'author', 'excerpt', 'coverUrl',
    'coverPath', 'coverAlt', 'locale', 'order', 'publishedAt', 'updatedAt'
  ]) {
    assert.equal(required.has(field), true, `${field} must remain in ResearchArticleCard`);
  }
  const detail = openapi.components.schemas.ResearchArticle;
  assert.equal(detail.unevaluatedProperties, false);
  assert.deepEqual(detail.allOf[1].required, ['contentHtml', 'contentMarkdown']);
  for (const [path, item] of Object.entries(openapi.paths)) {
    if (!path.startsWith('/api/research')) continue;
    assert.deepEqual(Object.keys(item), ['get'], `${path} must remain public read-only HTTP`);
    assert.deepEqual(item.get.security, []);
  }
});
