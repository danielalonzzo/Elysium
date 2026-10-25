import React from 'react';

/** Las pestañas segmentadas de una sección; el estado vive en la URL (`useSectionTab`). */
export default function SectionTabs({ tabs, active, onSelect, label }) {
  return (
    <nav className="crm-segmented-tabs crm-section-tabs" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`crm-segmented-tab ${active === tab.id ? 'is-active' : ''}`}
          aria-current={active === tab.id ? 'page' : undefined}
          onClick={() => onSelect(tab.id)}
        >
          <span>{tab.label}</span>
          {tab.badge !== undefined && (
            <span className={`crm-tab-badge ${tab.alert ? 'is-alert' : ''}`}>{tab.badge}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
