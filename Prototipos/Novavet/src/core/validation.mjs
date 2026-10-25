export const isStaff = role => ['admin','developer'].includes(role);
export function textValue(value, label, max=200) { if(typeof value !== 'string'||!value.trim()||value.length>max) throw new Error(`${label}: valor no válido.`); return value.trim(); }
export function integerValue(v,label,min=0,max=1000000){ const n=Number(v); if(!Number.isSafeInteger(n)||n<min||n>max) throw new Error(`${label}: valor no válido.`); return n; }
export function dateValue(v){if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v+'T12:00:00Z'))||new Date(v+'T12:00:00Z').toISOString().slice(0,10)!==v)throw new Error('Fecha no válida.');return v;}
export function canReadOwner(role, actor, owner){return isStaff(role)||actor===owner;}
export function roleForEmail(email, admins='', developers=''){const has=(s)=>s.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());return has(developers)?'developer':has(admins)?'admin':'client';}
export function csvCell(v){const s=String(v??'');return '"'+(/^[=+@\-\t\r]/.test(s)?"'"+s:s).replaceAll('"','""')+'"';}
