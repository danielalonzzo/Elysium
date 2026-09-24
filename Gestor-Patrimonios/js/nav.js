/** Navegación: grupos de la barra lateral y orden del menú «Más». */

export const NAV = Object.freeze([
    { group: 'Resumen', items: [
        { id: 'inicio', label: 'Inicio', icon: 'home', tone: 'blue' }
    ] },
    { group: 'Dinero', items: [
        { id: 'movimientos', label: 'Movimientos', icon: 'list', tone: 'blue' },
        { id: 'cuentas', label: 'Cuentas', icon: 'wallet', tone: 'teal' },
        { id: 'presupuestos', label: 'Presupuestos', icon: 'gauge', tone: 'amber', badge: 'budgets' },
        { id: 'calendario', label: 'Recurrentes', icon: 'calendar', tone: 'violet', badge: 'due' },
        { id: 'comprobantes', label: 'Comprobantes', icon: 'receipt', tone: 'sky' }
    ] },
    { group: 'Futuro', items: [
        { id: 'metas', label: 'Metas', icon: 'target', tone: 'gold' },
        { id: 'simulador', label: 'Simulador', icon: 'calculator', tone: 'indigo' },
        { id: 'deudas', label: 'Deudas', icon: 'landmark', tone: 'slate' }
    ] },
    { group: 'Análisis', items: [
        { id: 'reportes', label: 'Reportes', icon: 'pie', tone: 'cyan' },
        { id: 'logros', label: 'Logros', icon: 'trophy', tone: 'gold', gamified: true }
    ] }
]);

export const NAV_ITEMS = Object.freeze([
    ...NAV.flatMap(group => group.items),
    { id: 'ajustes', label: 'Ajustes', icon: 'settings', tone: 'gray' }
]);
