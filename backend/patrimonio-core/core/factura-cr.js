// GENERADO por scripts/sync-patrimonio-core.mjs desde Gestor-Patrimonios/js/core/factura-cr.js.
// No se edita aquí: se edita el original y se vuelve a ejecutar el script.
/**
 * Lectura de comprobantes electrónicos de Hacienda (Costa Rica), v4.3 y v4.4.
 *
 * Al pagar dando la cédula, el comercio envía por correo el XML de la
 * factura: trae comercio, fecha, total, moneda, impuestos y líneas, firmado.
 * Leerlo es exacto, a diferencia de reconocer una foto, y no necesita IA.
 *
 * Se lee con expresiones regulares y no con DOMParser a propósito: el mismo
 * código corre en el navegador, en las pruebas de Node y en el backend. Los
 * nodos pueden llevar prefijo de espacio de nombres; se aceptan.
 */
import { toMinor, isCurrency } from './money.js';

export const DOCUMENT_TYPES = Object.freeze({
    FacturaElectronica: { label: 'Factura electrónica', direction: 'expense' },
    TiqueteElectronico: { label: 'Tiquete electrónico', direction: 'expense' },
    FacturaElectronicaCompra: { label: 'Factura electrónica de compra', direction: 'expense' },
    NotaCreditoElectronica: { label: 'Nota de crédito', direction: 'refund' },
    NotaDebitoElectronica: { label: 'Nota de débito', direction: 'expense' },
    FacturaElectronicaExportacion: { label: 'Factura de exportación', direction: 'expense' }
});

/** Medios de pago (v4.3 `MedioPago`, v4.4 `TipoMedioPago`) → medio de la app. */
const PAYMENT_METHODS = { '01': 'cash', '02': 'card', '03': 'transfer', '04': 'transfer', '05': 'other', '06': 'sinpe', '07': 'card', '99': 'other' };

const NS = '(?:[\\w.-]+:)?';

/** Un carácter numérico fuera de rango (`&#x110000;`) no debe romper la lectura de la factura. */
function fromCode(code) {
    return Number.isInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
}

function decodeEntities(raw) {
    return String(raw)
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => fromCode(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => fromCode(Number(dec)))
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
        .replace(/&amp;/g, '&');
}

function block(xml, name) {
    if (!xml) return null;
    const re = new RegExp(`<${NS}${name}\\b[^>]*>([\\s\\S]*?)</${NS}${name}\\s*>`);
    const match = xml.match(re);
    return match ? match[1] : null;
}

function blocks(xml, name) {
    if (!xml) return [];
    const re = new RegExp(`<${NS}${name}\\b[^>]*>([\\s\\S]*?)</${NS}${name}\\s*>`, 'g');
    return [...xml.matchAll(re)].map(match => match[1]);
}

function text(xml, ...path) {
    let current = xml;
    for (const name of path) {
        current = block(current, name);
        if (current == null) return null;
    }
    const value = decodeEntities(current).replace(/\s+/g, ' ').trim();
    return value || null;
}

function amount(xml, ...path) {
    const value = text(xml, ...path);
    if (value == null) return null;
    const number = Number(value.replace(/,/g, ''));
    return Number.isFinite(number) ? toMinor(number) : null;
}

/** Nombre del elemento raíz, sin prefijo ni declaración XML. */
function rootName(xml) {
    const match = String(xml).replace(/<\?xml[\s\S]*?\?>/, '').match(/<(?:[\w.-]+:)?([A-Za-z]+)[\s>]/);
    return match ? match[1] : null;
}

export class FacturaError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}

/**
 * @param {string} xmlText
 * @returns {{documentType: string, label: string, direction: string, version: string|null,
 *   clave: string|null, consecutivo: string|null, date: string|null, issuedAt: string|null,
 *   issuer: object, receiver: object, currency: string, fxRate: number|null,
 *   totalMinor: number, taxMinor: number, discountMinor: number, method: string|null,
 *   lines: Array, merchant: string}}
 */
export function parseFactura(xmlText) {
    const raw = String(xmlText || '');
    if (!raw.trim().startsWith('<')) throw new FacturaError('not-xml', 'El archivo no es un XML.');
    const xml = raw.replace(/<(?:[\w.-]+:)?Signature\b[\s\S]*?<\/(?:[\w.-]+:)?Signature\s*>/g, '');
    const root = rootName(xml);

    if (root === 'MensajeHacienda' || root === 'MensajeReceptor') {
        throw new FacturaError('hacienda-message',
            'Este XML es la respuesta de Hacienda, no la factura. Suba el otro XML que llegó en el mismo correo.');
    }
    const type = DOCUMENT_TYPES[root];
    if (!type) throw new FacturaError('unknown-document', 'No parece un comprobante electrónico de Hacienda.');

    const versionMatch = xml.match(/comprobanteselectronicos\.go\.cr\/xml-schemas\/v?(\d\.\d)/i);
    const issuedAt = text(xml, 'FechaEmision');
    const resumen = block(xml, 'ResumenFactura') || '';
    const currency = text(resumen, 'CodigoTipoMoneda', 'CodigoMoneda') || text(resumen, 'CodigoMoneda') || 'CRC';
    const fxText = text(resumen, 'CodigoTipoMoneda', 'TipoCambio') || text(resumen, 'TipoCambio');

    const methodCode = text(resumen, 'MedioPago', 'TipoMedioPago') || text(xml, 'MedioPago');
    const emisor = block(xml, 'Emisor') || '';
    const receptor = block(xml, 'Receptor') || '';

    const issuer = {
        name: text(emisor, 'Nombre'),
        tradeName: text(emisor, 'NombreComercial'),
        idType: text(emisor, 'Identificacion', 'Tipo'),
        id: text(emisor, 'Identificacion', 'Numero'),
        email: text(emisor, 'CorreoElectronico')
    };
    const receiver = {
        name: text(receptor, 'Nombre'),
        idType: text(receptor, 'Identificacion', 'Tipo'),
        id: text(receptor, 'Identificacion', 'Numero')
    };

    const lines = blocks(block(xml, 'DetalleServicio') || '', 'LineaDetalle').slice(0, 60).map(line => ({
        detail: text(line, 'Detalle'),
        quantity: Number(text(line, 'Cantidad')) || 1,
        unitPriceMinor: amount(line, 'PrecioUnitario'),
        totalMinor: amount(line, 'MontoTotalLinea') ?? amount(line, 'MontoTotal'),
        taxRate: Number(text(line, 'Impuesto', 'Tarifa')) || 0
    }));

    const totalMinor = amount(resumen, 'TotalComprobante');
    if (totalMinor == null) throw new FacturaError('no-total', 'El comprobante no trae el total.');

    return {
        documentType: root,
        label: type.label,
        direction: type.direction,
        version: versionMatch ? versionMatch[1] : null,
        clave: text(xml, 'Clave'),
        consecutivo: text(xml, 'NumeroConsecutivo'),
        issuedAt,
        date: issuedAt && /^\d{4}-\d{2}-\d{2}/.test(issuedAt) ? issuedAt.slice(0, 10) : null,
        issuer,
        receiver,
        currency: currency.toUpperCase(),
        fxRate: fxText ? Number(fxText) || null : null,
        totalMinor,
        taxMinor: amount(resumen, 'TotalImpuesto') || 0,
        discountMinor: amount(resumen, 'TotalDescuentos') || 0,
        method: methodCode ? PAYMENT_METHODS[methodCode.padStart(2, '0')] || 'other' : null,
        lines,
        merchant: prettyMerchant(issuer.tradeName || issuer.name || '')
    };
}

/**
 * Los nombres legales llegan en mayúsculas y con la razón social completa
 * («AUTOMERCADO SOCIEDAD ANONIMA»). Para la lista de movimientos se prefiere
 * «Automercado».
 */
export function prettyMerchant(name) {
    const cleaned = String(name || '')
        .replace(/\b(SOCIEDAD\s+AN[OÓ]NIMA|S\.?\s?A\.?|S\.?R\.?L\.?|LIMITADA|LTDA\.?|DE\s+RESPONSABILIDAD\s+LIMITADA)\s*$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (!cleaned) return '';
    const isUpper = cleaned === cleaned.toUpperCase();
    if (!isUpper) return cleaned;
    const small = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'en', 'el']);
    return cleaned.toLowerCase().split(' ').map((word, i) =>
        (i > 0 && small.has(word)) ? word : word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

/**
 * Sentido del comprobante para quien lo sube, según su cédula:
 * - factura o tiquete: si la emitió, es un ingreso; si la recibió, un gasto;
 * - factura de compra: la emite quien compra (a un proveedor sin factura), así
 *   que si la emitió es un gasto suyo, y si es el proveedor, un ingreso;
 * - nota de crédito: recibida es un reembolso (ingreso); emitida, dinero que
 *   devolvió (gasto);
 * - nota de débito: como una factura.
 */
export function directionFor(parsed, ownTaxId) {
    const digits = value => String(value || '').replace(/\D/g, '');
    const own = digits(ownTaxId);
    const isIssuer = Boolean(own) && digits(parsed.issuer?.id) === own;
    const isReceiver = Boolean(own) && digits(parsed.receiver?.id) === own;
    switch (parsed.documentType) {
        case 'FacturaElectronicaCompra': return isReceiver && !isIssuer ? 'income' : 'expense';
        case 'NotaCreditoElectronica': return isIssuer ? 'expense' : 'income';
        default: return isIssuer ? 'income' : 'expense';
    }
}

/**
 * Moneda e importes de la factura tal como la app puede guardarlos. Una moneda
 * que la app no maneja (libras, pesos) se pasa a colones con el tipo de cambio
 * que trae el propio comprobante; si no lo trae, no se inventa nada: se avisa.
 *
 * @returns {{currency: string, totalMinor: number, taxMinor: number, note: string, unsupported: boolean, converted: boolean}}
 */
export function facturaAmounts(parsed) {
    if (isCurrency(parsed.currency)) {
        return { currency: parsed.currency, totalMinor: parsed.totalMinor, taxMinor: parsed.taxMinor || 0, note: '', unsupported: false, converted: false };
    }
    const rate = Number(parsed.fxRate) > 0 ? Number(parsed.fxRate) : null;
    const original = `${(parsed.totalMinor / 100).toFixed(2).replace('.', ',')} ${parsed.currency}`;
    if (!rate) {
        return { currency: 'CRC', totalMinor: parsed.totalMinor, taxMinor: parsed.taxMinor || 0, note: `Factura en ${parsed.currency} (${original}): revise el monto.`, unsupported: true, converted: false };
    }
    return {
        currency: 'CRC',
        totalMinor: Math.round(parsed.totalMinor * rate),
        taxMinor: Math.round((parsed.taxMinor || 0) * rate),
        note: `Original: ${original} a ₡${String(rate).replace('.', ',')}.`,
        unsupported: false,
        converted: true
    };
}
