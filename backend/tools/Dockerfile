# elysium-tools — ver README.md.
#
# Deno resuelve los desafíos de JavaScript de YouTube; yt-dlp lo busca en el
# PATH y, a diferencia de Node, lo ejecuta sin permisos sobre el sistema.
FROM denoland/deno:bin-2.9.8 AS deno

FROM node:22-trixie-slim

ENV NODE_ENV=production \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1 \
    YTDLP_BIN=/opt/yt-dlp/bin/yt-dlp \
    PDF_PYTHON=/opt/pdf/bin/python

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates ffmpeg python3 python3-venv \
 && rm -rf /var/lib/apt/lists/*

# yt-dlp sin versión fija, a propósito: las plataformas cambian cada pocas
# semanas y el arreglo llega siempre en la última. Volver a desplegar es
# actualizarlo. `curl-cffi` le deja imitar a un navegador donde hace falta.
RUN python3 -m venv /opt/yt-dlp \
 && /opt/yt-dlp/bin/pip install "yt-dlp[default,curl-cffi]" \
 && /opt/yt-dlp/bin/yt-dlp --version

# PDF → Word, en su propio entorno para no mezclar dependencias con yt-dlp.
# PyMuPDF por debajo de la 2.0: la 2.0 arrastra onnxruntime y modelos de
# maquetación (cientos de MB) que pdf2docx no usa. PyMuPDF es AGPL: se usa sin
# modificar, en un servicio interno (ver README.md).
RUN python3 -m venv /opt/pdf \
 && /opt/pdf/bin/pip install "pdf2docx" "pymupdf<2" \
 && /opt/pdf/bin/python -c "import pdf2docx, pymupdf, cv2; print('pdf2docx ok', pymupdf.VersionBind)"

COPY --from=deno /deno /usr/local/bin/deno

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY server.js workspace.js video.js video-routes.js pdf-routes.js pdf_to_docx.py ./

USER node
CMD ["node", "server.js"]
