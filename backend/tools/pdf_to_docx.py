"""Convierte un PDF en DOCX con pdf2docx y cuenta el progreso en JSON.

Lo lanza `pdf-routes.js`. Por la salida estándar va solo una línea JSON por
evento: `info` (páginas), `stage`, `page`, `warning`, `done` o `error`. Todo
lo demás —el registro de pdf2docx, los avisos de PyMuPDF, cualquier `print`—
se desvía a la salida de errores para que no se mezcle.

Uso: python pdf_to_docx.py entrada.pdf salida.docx
"""
import contextlib
import json
import logging
import re
import sys
import warnings

OUT = sys.stdout
ANSI = re.compile(r'\x1b\[[0-9;]*m')
STAGES = {'1': 'opening', '2': 'analyzing', '3': 'parsing', '4': 'creating'}
MAX_PAGES = 500


def emit(**event):
    OUT.write(json.dumps(event) + '\n')
    OUT.flush()


class Progress(logging.Handler):
    """Traduce el registro de pdf2docx: «[3/4] Parsing pages...», «(2/7) Page 2»."""

    def __init__(self):
        super().__init__()
        self.stage = None

    def emit(self, record):
        message = ANSI.sub('', record.getMessage())
        step = re.search(r'\[(\d)/4\]', message)
        if step and step.group(1) in STAGES:
            self.stage = STAGES[step.group(1)]
            emit(type='stage', stage=self.stage)
            return
        page = re.search(r'\((\d+)/(\d+)\)\s*Page', message)
        if page and self.stage in ('parsing', 'creating'):
            emit(type='page', stage=self.stage, page=int(page.group(1)), pages=int(page.group(2)))


def inspect(source):
    """Lo que se puede saber antes de convertir: si abre, si pide contraseña y si tiene texto."""
    import pymupdf
    try:
        document = pymupdf.open(source)
    except Exception:
        return 'pdf_invalid', None, False
    try:
        if document.needs_pass:
            return 'pdf_encrypted', None, False
        pages = document.page_count
        if pages == 0:
            return 'pdf_invalid', None, False
        if pages > MAX_PAGES:
            return 'pdf_too_many_pages', pages, False
        # Un PDF escaneado no trae texto: el Word saldrá con las páginas como imágenes.
        has_text = any(page.get_text('text').strip() for page in document)
        return None, pages, has_text
    finally:
        document.close()


def main(source, target):
    warnings.simplefilter('ignore')
    handler = Progress()
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.INFO)

    with contextlib.redirect_stdout(sys.stderr):
        problem, pages, has_text = inspect(source)
    if problem:
        emit(type='error', code=problem, pages=pages)
        return 2
    emit(type='info', pages=pages)
    if not has_text:
        emit(type='warning', code='scanned')

    with contextlib.redirect_stdout(sys.stderr):
        from pdf2docx import Converter
        converter = Converter(source)
        try:
            converter.convert(target, multi_processing=False)
        except Exception as error:  # pdf2docx lanza de todo: se cuenta y se sale.
            emit(type='error', code='pdf_failed', detail=str(error)[:300])
            return 1
        finally:
            converter.close()
    emit(type='done')
    return 0


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.stderr.write('Uso: python pdf_to_docx.py entrada.pdf salida.docx\n')
        sys.exit(64)
    sys.exit(main(sys.argv[1], sys.argv[2]))
