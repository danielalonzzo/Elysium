'use strict';

/**
 * Un `pdf_to_docx.py` de mentira para las pruebas: recibe los mismos
 * argumentos (entrada.pdf salida.docx) y escribe las mismas líneas JSON que el
 * de verdad (comprobadas con pdf2docx 0.5.13), sin Python.
 *
 * Qué pasa lo decide el contenido del PDF:
 *   …ENCRYPTED…  pide contraseña
 *   …SCANNED…    no trae texto: avisa y convierte igual
 *   …SLOW…       no termina hasta que lo cancelen
 *   …CRASH…      se cae sin decir nada en JSON
 */
const fs = require('node:fs');

const [source, target] = process.argv.slice(2);
const pdf = fs.readFileSync(source, 'latin1');
const out = event => process.stdout.write(`${JSON.stringify(event)}\n`);

if (pdf.includes('ENCRYPTED')) {
  out({ type: 'error', code: 'pdf_encrypted', pages: null });
  process.exit(2);
}
if (pdf.includes('CRASH')) {
  process.stdout.write('Traceback (most recent call last): …\n');
  process.exit(1);
}

const pages = 3;
out({ type: 'info', pages });
if (pdf.includes('SCANNED')) out({ type: 'warning', code: 'scanned' });
out({ type: 'stage', stage: 'opening' });
out({ type: 'stage', stage: 'analyzing' });

if (pdf.includes('SLOW')) {
  out({ type: 'stage', stage: 'parsing' });
  setInterval(() => out({ type: 'page', stage: 'parsing', page: 1, pages }), 50);
  process.on('SIGTERM', () => process.exit(143));
} else {
  for (const stage of ['parsing', 'creating']) {
    out({ type: 'stage', stage });
    for (let page = 1; page <= pages; page += 1) out({ type: 'page', stage, page, pages });
  }
  // Un .docx es un zip: basta con la firma para las pruebas.
  fs.writeFileSync(target, Buffer.concat([Buffer.from('PK\u0003\u0004'), Buffer.alloc(996, 1)]));
  process.stderr.write('[INFO] Terminated in 0.01s.\n');
  out({ type: 'done' });
}
