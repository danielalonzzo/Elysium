import React from 'react';
import { Inbox, Loader2 } from 'lucide-react';
const t = key => ({'crm.dismissNotice':'Descartar aviso','crm.close':'Cerrar'}[key] || key);

/**
 * Piezas compartidas por todas las secciones del CRM.
 *
 * Viven en un único archivo a propósito: son primitivas de presentación de diez
 * o veinte líneas y repartirlas en un archivo cada una sólo añadiría imports.
 * La regla para que crezca sano: aquí no entra nada que sepa de Firestore.
 */

export function SectionHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="crm-section-header">
      <div>
        {eyebrow && <span className="crm-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="crm-section-actions">{actions}</div>}
    </header>
  );
}

export function KpiGrid({ children }) {
  return <div className="crm-kpi-grid">{children}</div>;
}

export function Kpi({ label, value, hint, tone = 'default' }) {
  return (
    <article className={`crm-kpi crm-kpi--${tone}`}>
      <p className="crm-kpi-label">{label}</p>
      <p className="crm-kpi-value">{value}</p>
      {hint && <p className="crm-kpi-hint">{hint}</p>}
    </article>
  );
}

export function Panel({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`crm-panel ${className}`}>
      {(title || actions) && (
        <div className="crm-panel-head">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="crm-panel-actions">{actions}</div>}
        </div>
      )}
      <div className="crm-panel-body">{children}</div>
    </section>
  );
}

/** Tabla con desplazamiento horizontal propio: el marco de la app nunca se mueve. */
export function TableWrap({ children }) {
  return <div className="crm-table-wrap"><table className="crm-table">{children}</table></div>;
}

const TONE_CLASS = {
  neutral: 'is-neutral',
  info: 'is-info',
  success: 'is-success',
  warn: 'is-warn',
  danger: 'is-danger',
};

export function Chip({ children, tone = 'neutral' }) {
  return <span className={`crm-chip ${TONE_CLASS[tone] || TONE_CLASS.neutral}`}>{children}</span>;
}

export function EmptyState({ title, description, action, icon: Icon = Inbox }) {
  return (
    <div className="crm-empty">
      <Icon size={30} aria-hidden="true" />
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function Loading({ label = 'Cargando…' }) {
  return (
    <div className="crm-loading" role="status">
      <Loader2 size={20} className="crm-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

/**
 * Aviso de resultado de una acción. Se pinta arriba de la sección y no
 * desaparece solo: si una operación falló, el mensaje tiene que seguir ahí
 * cuando el usuario vuelva de leer otra cosa.
 */
export function Feedback({ feedback, onDismiss }) {
  if (!feedback) return null;
  return (
    <div className={`crm-feedback is-${feedback.tone || 'info'}`} role="status">
      <span>{feedback.message}</span>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label={t('crm.dismissNotice')}>×</button>
      )}
    </div>
  );
}

export function Toolbar({ children }) {
  return <div className="crm-toolbar">{children}</div>;
}

export function Field({ label, hint, children, wide = false }) {
  return (
    <label className={`crm-field ${wide ? 'crm-field--wide' : ''}`}>
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Button({ variant = 'secondary', busy = false, children, ...props }) {
  return (
    <button type="button" className={`crm-button crm-button--${variant}`} disabled={busy || props.disabled} {...props}>
      {busy && <Loader2 size={15} className="crm-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

/** Modal centrado. El fondo cierra; el contenido no propaga el clic. */
export function Modal({ open, title, description, onClose, children, footer, wide = false }) {
  if (!open) return null;
  return (
    <div className="crm-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className={`crm-modal ${wide ? 'crm-modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="crm-modal-head">
          <div>
            <h2>{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <button type="button" className="crm-icon-button" onClick={onClose} aria-label={t('crm.close')}>×</button>
        </div>
        <div className="crm-modal-body">{children}</div>
        {footer && <div className="crm-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
