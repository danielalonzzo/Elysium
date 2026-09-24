/*
 * Arranque síncrono en el <head>: aplica el tema y el modo discreto antes del
 * primer pintado, para que la app no parpadee de claro a oscuro al abrir.
 * Es un script clásico (no módulo) a propósito: los módulos se ejecutan tarde.
 */
(function () {
    var root = document.documentElement;
    var theme = 'dark';
    var privateMode = false;
    try {
        theme = JSON.parse(localStorage.getItem('patrimonio-theme') || '"dark"');
        privateMode = JSON.parse(localStorage.getItem('patrimonio-private') || 'false');
    } catch (error) { /* almacenamiento bloqueado: valores por defecto */ }
    if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
    else root.removeAttribute('data-theme');
    if (privateMode) root.classList.add('is-private');
    if (!navigator.onLine) root.classList.add('is-offline');
})();
