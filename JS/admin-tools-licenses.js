const COPY = {
    en: { title: 'Elysium Tools', intro: 'Free licenses linked to an Elysium profile. Requests require a verified email and manual approval.',
        empty: 'No Tools requests.', approve: 'Approve free license', reject: 'Reject', suspend: 'Suspend', reactivate: 'Reactivate',
        profile: 'View profile', refresh: 'Refresh', more: 'Load more', person: 'Person', license: 'License', status: 'Status', actions: 'Actions',
        pending: 'Pending', active: 'Active · free', rejected: 'Rejected', suspended: 'Suspended', error: 'The Tools licenses could not be updated.' },
    es: { title: 'Elysium Tools', intro: 'Licencias gratuitas vinculadas a un perfil Elysium. Las solicitudes requieren correo verificado y aprobación manual.',
        empty: 'No hay solicitudes de Tools.', approve: 'Aprobar licencia gratuita', reject: 'Rechazar', suspend: 'Suspender', reactivate: 'Reactivar',
        profile: 'Ver perfil', refresh: 'Actualizar', more: 'Cargar más', person: 'Persona', license: 'Licencia', status: 'Estado', actions: 'Acciones',
        pending: 'Pendiente', active: 'Activa · gratuita', rejected: 'Rechazada', suspended: 'Suspendida', error: 'No se pudieron actualizar las licencias de Tools.' },
    pt: { title: 'Elysium Tools', intro: 'Licenças gratuitas associadas a um perfil Elysium. Os pedidos exigem e-mail confirmado e aprovação manual.',
        empty: 'Não há pedidos de Tools.', approve: 'Aprovar licença gratuita', reject: 'Rejeitar', suspend: 'Suspender', reactivate: 'Reativar',
        profile: 'Ver perfil', refresh: 'Atualizar', more: 'Carregar mais', person: 'Pessoa', license: 'Licença', status: 'Estado', actions: 'Ações',
        pending: 'Pendente', active: 'Ativa · gratuita', rejected: 'Rejeitada', suspended: 'Suspensa', error: 'Não foi possível atualizar as licenças de Tools.' }
};
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

export async function loadToolsLicenses({ auth, language, onProfile }) {
    const t = COPY[language] || COPY.en;
    let host = document.getElementById('tools-licenses');
    if (!host) {
        host = document.createElement('section'); host.id = 'tools-licenses'; host.className = 'patrimonio-licenses';
        document.getElementById('licenses')?.prepend(host);
    }
    const generation = Symbol(); host.generation = generation;
    let rows = [], cursor = null;
    async function api(path = '', body) {
        const response = await fetch(`/api/tools-license/admin${path}`, { method: body ? 'POST' : 'GET',
            headers: { Authorization: `Bearer ${await auth.currentUser.getIdToken()}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
            body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
        if (!response.ok) throw new Error(t.error);
        return response.json();
    }
    const button = (label, action, uid = '') => `<button type="button" class="btn btn-outline btn-sm" data-tools-license-action="${action}" data-uid="${esc(uid)}">${esc(label)}</button>`;
    function render(error = '') {
        if (host.generation !== generation) return;
        const pending = rows.filter(row => row.status === 'pending').length;
        host.innerHTML = `<div class="portal-header"><div><h2>${t.title}${pending ? ` · ${pending} ${t.pending.toLowerCase()}` : ''}</h2><p>${t.intro}</p></div>${button(t.refresh, 'refresh')}</div>
            ${error ? `<p role="alert">${esc(error)}</p>` : ''}
            <div class="portal-table-wrap"><table class="portal-table"><thead><tr>${[t.person, t.license, t.status, t.actions].map(label => `<th>${label}</th>`).join('')}</tr></thead><tbody>
            ${rows.length ? [...rows].sort((a, b) => (b.status === 'pending') - (a.status === 'pending') || String(b.requestedAt).localeCompare(String(a.requestedAt))).map(row => `<tr>
                <td><strong>${esc(row.name)}</strong><br>${esc(row.email)}${row.note ? `<p>${esc(row.note)}</p>` : ''}${button(t.profile, 'profile', row.userId)}</td>
                <td>${esc(row.license?.licenseCode || '—')}<br>0 EUR</td><td>${esc(t[row.status] || row.status)}</td>
                <td><div class="patrimonio-actions">${row.license ? button(row.status === 'active' ? t.suspend : t.reactivate, row.status === 'active' ? 'suspend' : 'reactivate', row.userId)
                    : `${button(t.approve, 'approve', row.userId)}${row.status === 'pending' ? button(t.reject, 'reject', row.userId) : ''}`}</div></td></tr>`).join('') : `<tr><td colspan="4">${t.empty}</td></tr>`}
            </tbody></table></div>${cursor ? button(t.more, 'more') : ''}`;
    }
    async function load(more = false) {
        const data = await api(more && cursor ? `?cursor=${encodeURIComponent(cursor)}` : '');
        if (host.generation !== generation) return;
        rows = more ? [...rows, ...data.rows] : data.rows; cursor = data.nextCursor; render();
    }
    host.onclick = async event => {
        const target = event.target.closest('[data-tools-license-action]');
        if (!target || host.generation !== generation) return;
        const action = target.dataset.toolsLicenseAction;
        host.querySelectorAll('button').forEach(button => { button.disabled = true; });
        try {
            if (action === 'profile') await onProfile(target.dataset.uid);
            else if (action === 'more' || action === 'refresh') await load(action === 'more');
            else { await api(`/${encodeURIComponent(target.dataset.uid)}`, { action }); await load(); }
        } catch { render(t.error); }
        finally { host.querySelectorAll('button').forEach(button => { button.disabled = false; }); }
    };
    render();
    try { await load(); } catch { render(t.error); }
}
