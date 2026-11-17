/**
 * Catálogos: los valores que viajan a la base y la etiqueta con que se enseñan.
 *
 * La clave es dato —la guarda Firestore, la compara el motor— y no se traduce
 * ni se renombra a la ligera. La etiqueta es interfaz y se puede reescribir.
 * Está todo en un sitio porque lo leen el motor, el API, el portal y la demo,
 * y cuatro listas que tienen que coincidir acaban sin coincidir.
 */

/* ------------------------------------------------------------------ *
 * Suscripción
 * ------------------------------------------------------------------ */

/** El único plan. La referencia en colones del sitio es orientativa, no una tasa. */
export const PLAN = Object.freeze({ amountMinor: 12000, currency: 'USD', label: 'US$120 al mes' });

export const MODULES = Object.freeze(['erp', 'qms', 'audit']);

/** Períodos liquidados que hacen falta para que se abra cada módulo. */
export const MODULE_PERIODS = Object.freeze({ erp: 1, qms: 2, audit: 3 });

export const MODULE_LABEL = Object.freeze({
    erp: 'Control financiero',
    qms: 'Orden operativo',
    audit: 'Auditoría mensual'
});

export const SUBSCRIPTION_LABEL = Object.freeze({
    pending_activation: 'Pendiente de activación',
    active: 'Activa',
    past_due: 'Pago vencido',
    suspended: 'Suspendida',
    cancel_at_period_end: 'Termina al cerrar el período',
    canceled: 'Cancelada'
});

/* ------------------------------------------------------------------ *
 * Personas y permisos
 * ------------------------------------------------------------------ */

export const TENANT_ROLES = Object.freeze(['owner', 'operations', 'collections', 'staff', 'viewer']);

export const TENANT_ROLE_LABEL = Object.freeze({
    owner: 'Propietario',
    operations: 'Operaciones',
    collections: 'Cobros',
    staff: 'Colaborador',
    viewer: 'Consulta'
});

export const TENANT_ROLE_HINT = Object.freeze({
    owner: 'Ve y hace todo, incluidos los costos, los márgenes y la gente.',
    operations: 'Inventario, ventas, listas de tareas y equipos. No ve costos ni márgenes.',
    collections: 'Clientes, ventas y cobros. No ve costos ni márgenes.',
    staff: 'Solo las listas de tareas que le tocan.',
    viewer: 'Consulta todo, sin registrar nada.'
});

/**
 * Lo que autoriza una operación es la capacidad, no el nombre del papel.
 *
 * `cost.read` va aparte a propósito: el dueño de un negocio pequeño casi nunca
 * quiere que quien despacha vea cuánto le cuesta cada producto. Sin ella, las
 * listas llegan sin costo ni margen —el servidor los quita, no los esconde la
 * pantalla.
 */
export const CAPABILITIES = Object.freeze({
    'product.manage': 'Crear y editar productos',
    'inventory.read': 'Ver existencias',
    'inventory.adjust': 'Registrar entradas, mermas y conteos',
    'sale.read': 'Ver ventas',
    'sale.record': 'Registrar ventas',
    'sale.void': 'Anular ventas',
    'customer.read': 'Ver clientes y saldos',
    'customer.manage': 'Crear y editar clientes',
    'payment.record': 'Registrar cobros',
    'payment.void': 'Anular cobros',
    'cost.read': 'Ver costos y márgenes',
    'report.read': 'Ver el resumen y los informes del negocio',
    'report.generate': 'Generar el cierre de un mes',
    'process.read': 'Ver las listas de tareas',
    'process.run': 'Marcar tareas',
    'process.manage': 'Crear y publicar listas de tareas',
    'equipment.read': 'Ver equipos y mantenimientos',
    'equipment.manage': 'Editar equipos y registrar mantenimientos',
    'members.manage': 'Administrar quién entra al negocio'
});

export const DEFAULT_CAPABILITIES = Object.freeze({
    owner: ['*'],
    operations: [
        'product.manage', 'inventory.read', 'inventory.adjust', 'sale.read', 'sale.record', 'customer.read',
        'process.read', 'process.run', 'process.manage', 'equipment.read', 'equipment.manage'
    ],
    collections: ['sale.read', 'customer.read', 'customer.manage', 'payment.record', 'process.read', 'process.run'],
    staff: ['process.read', 'process.run'],
    viewer: ['inventory.read', 'sale.read', 'customer.read', 'cost.read', 'report.read', 'process.read', 'equipment.read']
});

/** Capacidades de solo lectura: las conserva un negocio con la suscripción suspendida. */
export const READ_CAPABILITIES = Object.freeze([
    'inventory.read', 'sale.read', 'customer.read', 'cost.read', 'report.read', 'process.read', 'equipment.read'
]);

/* ------------------------------------------------------------------ *
 * Control financiero
 * ------------------------------------------------------------------ */

export const PRODUCT_KINDS = Object.freeze(['good', 'service']);
export const PRODUCT_KIND_LABEL = Object.freeze({ good: 'Producto', service: 'Servicio' });

export const UNITS = Object.freeze(['unidad', 'kg', 'g', 'litro', 'ml', 'metro', 'caja', 'paquete', 'par', 'hora', 'servicio']);

/**
 * Tipos de movimiento de inventario. `sign` dice hacia dónde mueve la
 * existencia; `manual` marca los que una persona registra a mano (los demás
 * los escribe el sistema al vender, anular o cargar la incorporación).
 */
export const MOVEMENT_TYPES = Object.freeze({
    opening: { label: 'Existencia inicial', sign: 1, manual: false },
    purchase: { label: 'Entrada por compra', sign: 1, manual: true },
    return: { label: 'Devolución de cliente', sign: 1, manual: true },
    adjustment: { label: 'Ajuste por conteo', sign: 0, manual: true },
    waste: { label: 'Merma o daño', sign: -1, manual: true },
    sale: { label: 'Venta', sign: -1, manual: false },
    void: { label: 'Anulación de venta', sign: 1, manual: false }
});

export const SALE_TERMS = Object.freeze(['cash', 'credit']);
export const SALE_TERM_LABEL = Object.freeze({ cash: 'De contado', credit: 'A crédito' });

export const PAYMENT_METHODS = Object.freeze(['efectivo', 'sinpe', 'transferencia', 'tarjeta', 'cheque', 'otro']);
export const PAYMENT_METHOD_LABEL = Object.freeze({
    efectivo: 'Efectivo',
    sinpe: 'SINPE Móvil',
    transferencia: 'Transferencia',
    tarjeta: 'Tarjeta',
    cheque: 'Cheque',
    otro: 'Otro'
});

/** Tramos de antigüedad de un saldo vencido, en días. */
export const AGING_BUCKETS = Object.freeze([
    { id: 'current', label: 'Al día', from: -Infinity, to: 0 },
    { id: 'd30', label: '1 a 30 días', from: 1, to: 30 },
    { id: 'd60', label: '31 a 60 días', from: 31, to: 60 },
    { id: 'd90', label: '61 a 90 días', from: 61, to: 90 },
    { id: 'older', label: 'Más de 90 días', from: 91, to: Infinity }
]);

export const DEFAULT_CREDIT_DAYS = 30;

/* ------------------------------------------------------------------ *
 * Orden operativo
 * ------------------------------------------------------------------ */

export const FREQUENCIES = Object.freeze(['daily', 'weekly', 'monthly', 'on_demand']);
export const FREQUENCY_LABEL = Object.freeze({
    daily: 'Todos los días',
    weekly: 'Cada semana',
    monthly: 'Cada mes',
    on_demand: 'Cuando haga falta'
});

export const PROCESS_STATUS_LABEL = Object.freeze({ draft: 'Borrador', published: 'Publicada', archived: 'Archivada' });

export const MAINTENANCE_TYPES = Object.freeze(['preventive', 'corrective']);
export const MAINTENANCE_TYPE_LABEL = Object.freeze({ preventive: 'Preventivo', corrective: 'Correctivo' });

/** Con cuántos días de antelación se avisa de un mantenimiento, si el equipo no dice otra cosa. */
export const DEFAULT_NOTICE_DAYS = 7;

/* ------------------------------------------------------------------ *
 * Captación
 * ------------------------------------------------------------------ */

/** Los giros a los que VALTRIX le habla. `otro` existe para no forzar a nadie. */
export const SECTORS = Object.freeze({
    taller: 'Taller mecánico',
    repuestos: 'Venta de repuestos',
    veterinaria: 'Clínica veterinaria',
    dental: 'Clínica dental',
    panaderia: 'Panadería',
    distribuidora: 'Distribuidora',
    otro: 'Otro'
});

/** Etapas de un prospecto, en el orden en que avanza la venta. */
export const LEAD_STAGES = Object.freeze(['new', 'contacted', 'demo', 'interested', 'won', 'lost']);
export const LEAD_STAGE_LABEL = Object.freeze({
    new: 'Por contactar',
    contacted: 'Contactado',
    demo: 'Demo presentada',
    interested: 'Interesado',
    won: 'Cliente',
    lost: 'No continuó'
});

export const LEAD_SOURCES = Object.freeze({
    conocido: 'Conocido o cercano',
    referido: 'Referido',
    contador: 'Contador',
    web: 'Sitio web',
    redes: 'Redes sociales',
    otro: 'Otro'
});

export const INTAKE_STATUS_LABEL = Object.freeze({
    none: 'Sin enviar el enlace',
    draft: 'Enlace enviado',
    submitted: 'Formulario recibido',
    applied: 'Cargado al sistema'
});

/** Topes del formulario de incorporación. Un lote cabe en un solo documento. */
export const INTAKE_LIMITS = Object.freeze({ products: 400, debtors: 200, team: 40, processes: 30, steps: 30, equipment: 80 });
