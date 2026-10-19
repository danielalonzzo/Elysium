import {STATIC_SITE, WHATSAPP} from './config';

/**
 * Hace llegar una consulta a la clínica.
 *
 * Con servidor (ChatGPT Sites) va a `/api/contact` y aparece en el CRM. La copia
 * estática de elysiumdr.eu/Vet-Dr-Valladares/ no tiene API, así que abre WhatsApp
 * con el mismo mensaje ya escrito: la persona solo tiene que enviarlo. Se abre
 * antes del primer `await` para que el navegador lo cuente como parte del clic.
 */
export async function sendInquiry(body: Record<string, unknown>, fallbackError: string): Promise<'saved' | 'whatsapp'> {
  if (STATIC_SITE) {
    if (body.website) return 'whatsapp';
    const field = (label: string, value: unknown) => value ? [`${label}: ${value}`] : [];
    const text = [
      ...field('Motivo', body.topic), ...field('Nombre', body.name), ...field('Teléfono', body.phone), ...field('Correo', body.email),
      ...field('Mascota', [body.petName, body.species].filter(Boolean).join(' · ')),
      '', String(body.message || ''),
    ].join('\n').trim();
    window.open(`${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    return 'whatsapp';
  }
  const r = await fetch('/api/contact', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)});
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || fallbackError);
  return 'saved';
}
