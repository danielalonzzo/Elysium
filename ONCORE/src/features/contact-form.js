/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PEDIDO DE CONTACTO — formulario de la sección Contactos (feature de ONCORE)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  Compone un email con los campos validados y lo abre en el cliente de correo
 *  del visitante. No hay envío por red ni almacenamiento en el navegador: el
 *  contenido nunca sale del dispositivo hasta que la persona pulsa «enviar» en
 *  su propio cliente de correo.
 *
 *  Es deliberado. ONCORE atiende a personas en tratamiento oncológico y el
 *  formulario puede recoger datos de categoría especial (Art. 9 RGPD). Hasta
 *  que exista el backend con el registro de tratamiento correspondiente
 *  (fase 2, F18), no se transmite ni se persiste nada.
 *
 *  API pública  Oncore.initContactForm()
 *
 *  Zero-dependency.
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (window, document) {
    'use strict';

    var Oncore = window.Oncore = window.Oncore || {};

    /** Textos por idioma del cuerpo del email y del estado del formulario. */
    var STRINGS = {
        pt: {
            subject: 'Pedido de contacto ONCORE',
            intro: 'Pedido de contacto recebido através do website ONCORE.',
            name: 'Nome', email: 'Email', phone: 'Telefone',
            profile: 'Perfil', interest: 'Área de interesse', message: 'Mensagem',
            consent: 'Consentimento RGPD: autorizou o contacto para resposta ao pedido.',
            status: 'A abrir o seu email para concluir o envio.'
        },
        en: {
            subject: 'ONCORE contact request',
            intro: 'Contact request received through the ONCORE website.',
            name: 'Name', email: 'Email', phone: 'Phone',
            profile: 'Profile', interest: 'Area of interest', message: 'Message',
            consent: 'GDPR consent: contact authorised for a reply to this request.',
            status: 'Opening your email client to complete the request.'
        }
    };

    /**
     * Inicializa el formulario de pedido de contacto.
     * @param {Object} [options]
     * @param {string} [options.formSel='#contactForm']         Selector del formulario.
     * @param {string} [options.statusSel='#contactFormStatus'] Selector del texto de estado.
     * @param {string} [options.mailTo='info@oncore.pt']        Destinatario.
     * @returns {void}
     */
    Oncore.initContactForm = function initContactForm(options) {
        var opts = options || {};
        var form = document.querySelector(opts.formSel || '#contactForm');
        if (!form) return;

        var statusEl = document.querySelector(opts.statusSel || '#contactFormStatus');
        var mailTo = opts.mailTo || 'info@oncore.pt';
        var isEnglish = document.documentElement.lang.toLowerCase().indexOf('en') === 0;
        var t = isEnglish ? STRINGS.en : STRINGS.pt;

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            var data = new FormData(form);
            var subject = t.subject + ' - ' + (data.get('name') || 'Website');
            var body = [
                t.intro,
                '',
                t.name + ': ' + (data.get('name') || ''),
                t.email + ': ' + (data.get('email') || ''),
                t.phone + ': ' + (data.get('phone') || ''),
                t.profile + ': ' + (data.get('profile') || ''),
                t.interest + ': ' + (data.get('interest') || ''),
                '',
                t.message + ':',
                data.get('message') || '',
                '',
                t.consent
            ].join('\n');

            if (statusEl) statusEl.textContent = t.status;

            window.location.href = 'mailto:' + mailTo
                + '?subject=' + encodeURIComponent(subject)
                + '&body=' + encodeURIComponent(body);
        });
    };
})(window, document);
