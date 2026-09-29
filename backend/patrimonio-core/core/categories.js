// GENERADO por scripts/sync-patrimonio-core.mjs desde Gestor-Patrimonios/js/core/categories.js.
// No se edita aquí: se edita el original y se vuelve a ejecutar el script.
/**
 * Categorías de partida, pensadas para Costa Rica (marchamo, CCSS, aguinaldo,
 * ICE/AyA). La persona las puede renombrar, archivar o crear nuevas; los ids
 * de estas son estables porque las alertas, los retos y los correos se
 * refieren a ellos (`restaurantes`, `aguinaldo`).
 *
 * `nature` las reparte en la regla 50/30/20: necesidad, deseo o ahorro/deuda.
 * `tone` es el tono del icono en la interfaz (no un color de gráfica: las
 * gráficas por categoría usan un solo tono y el nombre como identidad).
 */
import { plain } from './text.js';

export const EXPENSE_CATEGORIES = Object.freeze([
    { id: 'supermercado', name: 'Supermercado', icon: 'cart', nature: 'need', tone: 'green' },
    { id: 'restaurantes', name: 'Restaurantes', icon: 'utensils', nature: 'want', tone: 'orange' },
    { id: 'combustible', name: 'Combustible', icon: 'fuel', nature: 'need', tone: 'amber' },
    { id: 'transporte', name: 'Transporte', icon: 'bus', nature: 'need', tone: 'blue' },
    { id: 'vehiculo', name: 'Marchamo, RTV y taller', icon: 'car', nature: 'need', tone: 'slate' },
    { id: 'vivienda', name: 'Alquiler o hipoteca', icon: 'home', nature: 'need', tone: 'violet' },
    { id: 'servicios', name: 'Servicios (ICE, AyA, internet)', icon: 'bolt', nature: 'need', tone: 'cyan' },
    { id: 'salud', name: 'Salud y CCSS', icon: 'heart', nature: 'need', tone: 'red' },
    { id: 'educacion', name: 'Educación', icon: 'book', nature: 'need', tone: 'indigo' },
    { id: 'suscripciones', name: 'Suscripciones', icon: 'repeat', nature: 'want', tone: 'pink' },
    { id: 'ocio', name: 'Ocio y salidas', icon: 'ticket', nature: 'want', tone: 'magenta' },
    { id: 'ropa', name: 'Ropa y cuidado personal', icon: 'shirt', nature: 'want', tone: 'rose' },
    { id: 'hogar', name: 'Hogar', icon: 'sofa', nature: 'want', tone: 'teal' },
    { id: 'mascotas', name: 'Mascotas', icon: 'paw', nature: 'want', tone: 'amber' },
    { id: 'regalos', name: 'Regalos', icon: 'gift', nature: 'want', tone: 'pink' },
    { id: 'viajes', name: 'Viajes', icon: 'plane', nature: 'want', tone: 'sky' },
    { id: 'deudas', name: 'Cuotas y deudas', icon: 'landmark', nature: 'saving', tone: 'slate' },
    { id: 'comisiones', name: 'Comisiones e impuestos', icon: 'receipt', nature: 'need', tone: 'gray' },
    { id: 'otros-gastos', name: 'Otros gastos', icon: 'dots', nature: 'want', tone: 'gray' }
]);

export const INCOME_CATEGORIES = Object.freeze([
    { id: 'salario', name: 'Salario', icon: 'briefcase', tone: 'blue' },
    { id: 'aguinaldo', name: 'Aguinaldo', icon: 'gift', tone: 'gold' },
    { id: 'freelance', name: 'Trabajos independientes', icon: 'laptop', tone: 'violet' },
    { id: 'ventas', name: 'Ventas', icon: 'tag', tone: 'green' },
    { id: 'intereses', name: 'Intereses e inversiones', icon: 'trending-up', tone: 'teal' },
    { id: 'reembolsos', name: 'Reembolsos', icon: 'rotate-ccw', tone: 'cyan' },
    { id: 'otros-ingresos', name: 'Otros ingresos', icon: 'dots', tone: 'gray' }
]);

export function defaultCategories() {
    return [
        ...EXPENSE_CATEGORIES.map((category, order) => ({ ...category, kind: 'expense', order, archived: false })),
        ...INCOME_CATEGORIES.map((category, order) => ({ ...category, kind: 'income', nature: null, order, archived: false }))
    ];
}

/**
 * Palabras clave → categoría, en orden de prioridad. Se busca por palabras, no
 * por trozos de texto: «aya» (el acueducto) no está dentro de «Playa», ni «pet»
 * dentro de «Carpetas». `word` exige la palabra entera; `stem` deja que siga
 * (`super` encuentra «supermercado», `servicentro` encuentra «servicentros»).
 */
const word = (...list) => new RegExp(`(?<![a-z0-9])(?:${list.join('|')})(?![a-z0-9])`);
const stem = (...list) => new RegExp(`(?<![a-z0-9])(?:${list.join('|')})`);
const either = (...patterns) => ({ test: text => patterns.some(pattern => pattern.test(text)) });

/** @type {Array<[{test: (text: string) => boolean}, string]>} */
const KEYWORDS = [
    [either(word('walmart', 'masxmenos', 'mas x menos', 'automercado', 'auto mercado', 'pali', 'maxi pali', 'megasuper', 'fresh market', 'pricesmart', 'super', 'supermercado', 'abastecedor', 'pulperia'), stem('supermerc', 'pricesmart')), 'supermercado'],
    [either(word('restaurante', 'restaurantes', 'soda', 'sodas', 'pizza', 'pizzeria', 'burger', 'burguer', 'kfc', 'subway', 'starbucks', 'cafe', 'cafeteria', 'taco', 'tacos', 'sushi', 'rappi', 'uber ?eats', 'didi food', 'pedidos ya'), stem('mcdonald')), 'restaurantes'],
    [either(word('delta', 'uno', 'puma', 'recope', 'gasolina', 'gasolinera', 'combustible'), stem('servicentro', 'gasolin', 'total energ')), 'combustible'],
    [word('uber', 'didi', 'taxi', 'bus', 'buses', 'peaje', 'parqueo', 'parking', 'tren'), 'transporte'],
    [word('marchamo', 'riteve', 'rtv', 'dekra', 'taller', 'llanta', 'llantas', 'repuesto', 'repuestos', 'ins', 'seguro de auto'), 'vehiculo'],
    [word('alquiler', 'hipoteca', 'condominio'), 'vivienda'],
    [either(word('ice', 'kolbi', 'cnfl', 'aya', 'acueducto', 'jasec', 'esph', 'coopelesca', 'liberty', 'claro', 'tigo', 'cabletica', 'telecable', 'internet'), stem('electric')), 'servicios'],
    [word('farmacia', 'fischel', 'la bomba', 'clinica', 'hospital', 'ccss', 'ebais', 'laboratorio', 'dentista', 'optica'), 'salud'],
    [word('netflix', 'spotify', 'disney', 'hbo', 'max', 'prime', 'apple', 'icloud', 'google', 'youtube', 'chatgpt', 'adobe', 'microsoft'), 'suscripciones'],
    [word('cine', 'cinepolis', 'ccm', 'teatro', 'concierto', 'bar', 'discoteca', 'entrada', 'entradas'), 'ocio'],
    [word('zara', 'h&m', 'siman', 'ekono', 'universal', 'pequeno mundo', 'peluqueria', 'barberia', 'salon'), 'ropa'],
    [word('epa', 'construplaza', 'el lagar', 'ferreteria', 'colono', 'ikea', 'gollo', 'monge', 'importadora monge'), 'hogar'],
    [word('veterinaria', 'veterinario', 'mascota', 'mascotas', 'agroservicio', 'pet', 'pets'), 'mascotas'],
    [word('hotel', 'airbnb', 'booking', 'aerolinea', 'avianca', 'copa', 'volaris', 'sansa', 'vuelo', 'vuelos'), 'viajes']
];

export function matchCategory(label, categories, kind = 'expense') {
    const text = plain(label);
    if (!text) return null;
    const pool = (categories || []).filter(category => category.kind === kind && !category.archived);
    const exact = pool.find(category => plain(category.name) === text);
    if (exact) return exact.id;
    // Coincidencia parcial solo con palabras de cierta longitud: «a» no es «Alquiler».
    const partial = text.length >= 3 && pool.find(category => text.includes(plain(category.name)) || plain(category.name).includes(text));
    if (partial) return partial.id;
    if (kind === 'expense') {
        for (const [pattern, id] of KEYWORDS) {
            if (pattern.test(text) && pool.some(category => category.id === id)) return id;
        }
    }
    return null;
}
