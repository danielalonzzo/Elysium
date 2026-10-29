'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { documentName, looksLikePdf, parseConverterLine, progressFor } = require('./pdf-routes');

test('el nombre del .docx sale del PDF, sin ruta ni caracteres raros', () => {
  assert.equal(documentName('Contrato final.pdf'), 'Contrato final');
  assert.equal(documentName('C:\\Users\\ana\\Informe 2026.PDF'), 'Informe 2026');
  assert.equal(documentName('../../etc/passwd'), 'passwd');
  assert.equal(documentName('..pdf'), 'documento');
  assert.equal(documentName('a<b>c:"d|e?f*g'), 'a b c d e f g');
  assert.equal(documentName('Propuesta\u0000\nfinal'), 'Propuesta final');
  assert.equal(documentName(''), 'documento');
  assert.equal(documentName(undefined, 'pdf'), 'pdf');
  assert.equal(documentName('x'.repeat(300)).length, 120);
});

test('reconoce un PDF por su firma, aunque traiga basura delante', () => {
  assert.equal(looksLikePdf(Buffer.from('%PDF-1.7\n…')), true);
  assert.equal(looksLikePdf(Buffer.from('\ufeff  %PDF-1.4')), true);
  assert.equal(looksLikePdf(Buffer.from('PK\u0003\u0004')), false);
  assert.equal(looksLikePdf(Buffer.alloc(0)), false);
  assert.equal(looksLikePdf('%PDF-1.7'), false);
});

test('una sola barra para las dos pasadas de pdf2docx', () => {
  assert.equal(progressFor({ type: 'stage', stage: 'opening' }), 2);
  assert.equal(progressFor({ type: 'stage', stage: 'creating' }), 50);
  assert.equal(progressFor({ type: 'page', stage: 'parsing', page: 1, pages: 4 }), 17);
  assert.equal(progressFor({ type: 'page', stage: 'parsing', page: 4, pages: 4 }), 50);
  assert.equal(progressFor({ type: 'page', stage: 'creating', page: 2, pages: 4 }), 74);
  assert.equal(progressFor({ type: 'page', stage: 'creating', page: 4, pages: 4 }), 98);
  assert.equal(progressFor({ type: 'stage', stage: 'otra' }), null);
  assert.equal(progressFor({ type: 'page', stage: 'parsing', page: 1, pages: 0 }), null);
});

test('solo cuentan las líneas JSON del conversor', () => {
  assert.deepEqual(parseConverterLine('{"type": "page", "stage": "parsing", "page": 1, "pages": 7}'),
    { type: 'page', stage: 'parsing', page: 1, pages: 7 });
  assert.equal(parseConverterLine('[INFO] (1/7) Page 1'), null);
  assert.equal(parseConverterLine('warning: The `fitz` API is deprecated'), null);
  assert.equal(parseConverterLine('{roto'), null);
  assert.equal(parseConverterLine('{"sin": "tipo"}'), null);
});
