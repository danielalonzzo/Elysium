import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../app/chatgpt-auth';
import {isStaff,textValue,integerValue,dateValue,roleForEmail} from '../src/core/validation.mjs';
const fail=(message:string,status=400)=>Response.json({error:message},{status});
export async function api(request:Request){
 try{
 const user=await getChatGPTUser();if(!user)return fail('Inicie sesión para continuar.',401);
 const db=env.DB; if(!db)return fail('Base de datos no conectada.',503);
 await db.prepare("CREATE TABLE IF NOT EXISTS inquiries (id TEXT PRIMARY KEY,name TEXT NOT NULL,phone TEXT NOT NULL,email TEXT NOT NULL DEFAULT '',topic TEXT NOT NULL,pet_name TEXT NOT NULL DEFAULT '',species TEXT NOT NULL DEFAULT '',message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',created TEXT NOT NULL)").run();
 const secrets=env as unknown as Record<string,string>;
 const role=roleForEmail(user.email,secrets.ADMIN_EMAILS||'',secrets.DEVELOPER_EMAILS||'');
 await db.prepare('INSERT INTO users(id,name,email,role) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET role=excluded.role,email=excluded.email').bind(user.userId,user.displayName,user.email,role).run();
 const staff=isStaff(role),uid=user.userId;
 const query=async(sql:string,...args:unknown[]) => (await db.prepare(sql).bind(...args).all()).results;
 if(request.method==='GET'){
 const url=new URL(request.url),kind=url.searchParams.get('kind');
 if(kind==='slots'){const day=dateValue(url.searchParams.get('day')||'');const now=new Date().toISOString();return Response.json(await query("SELECT * FROM slots WHERE day=? AND active=1 AND day||'T'||time||':00-06:00' > ? AND NOT EXISTS(SELECT 1 FROM bookings WHERE bookings.slot=slots.id AND status != 'cancelled') ORDER BY time",day,now));}
 if(kind==='reports'){if(!staff)return fail('Acceso restringido.',403);const from=dateValue(url.searchParams.get('from')||'2026-01-01'),to=dateValue(url.searchParams.get('to')||'2099-12-31');return Response.json({totals:await query('SELECT b.status,COUNT(*) AS total FROM bookings b JOIN slots s ON s.id=b.slot WHERE s.day BETWEEN ? AND ? GROUP BY b.status',from,to),capacity:await query('SELECT COUNT(*) AS total FROM slots WHERE day BETWEEN ? AND ?',from,to),distribution:await query('SELECT s.day,s.time,COUNT(b.id) AS total FROM slots s LEFT JOIN bookings b ON b.slot=s.id AND b.status != ? WHERE s.day BETWEEN ? AND ? GROUP BY s.day,s.time ORDER BY s.day,s.time','cancelled',from,to)});}
 return Response.json({user:{...user,role},pets:await query(staff?'SELECT * FROM pets':'SELECT * FROM pets WHERE owner=?',...staff?[]:[uid]),bookings:await query('SELECT b.*,s.day,s.time,s.service,p.name AS petName,u.name AS clientName FROM bookings b JOIN slots s ON s.id=b.slot JOIN pets p ON p.id=b.pet JOIN users u ON u.id=b.owner'+(staff?'':' WHERE b.owner=?')+' ORDER BY s.day,s.time',...staff?[]:[uid]),products:staff?await query('SELECT * FROM products ORDER BY name'):[],clients:staff?await query('SELECT id,name,email,phone FROM users WHERE role=?','client'):[],inquiries:staff?await query('SELECT * FROM inquiries ORDER BY created DESC LIMIT 200'):[],records:await query(staff?'SELECT * FROM records ORDER BY created DESC':'SELECT * FROM records WHERE owner=? ORDER BY created DESC',...staff?[]:[uid]),slots:staff?await query('SELECT * FROM slots ORDER BY day,time'):[],audit:role==='developer'?await query('SELECT * FROM audit ORDER BY created DESC LIMIT 100'):[]});
 }
 if(request.method!=='POST')return fail('Método no permitido.',405);
 if(request.headers.get('origin')!==new URL(request.url).origin)return fail('Origen no válido.',403);
 if(!request.headers.get('content-type')?.includes('application/json'))return fail('Formato no válido.',415);
 const raw=await request.text();if(raw.length>15000)return fail('Solicitud demasiado grande.',413);
 const b=JSON.parse(raw),action=b.action,id=crypto.randomUUID(),at=new Date().toISOString();
 const log=(target:string)=>db.prepare('INSERT INTO audit VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),uid,action,target,at);
 if(action==='profile'){await db.batch([db.prepare('UPDATE users SET name=?,phone=? WHERE id=?').bind(textValue(b.name,'Nombre'),textValue(b.phone,'Teléfono',30),uid),log(uid)]);}
 else if(action==='pet'){const owner=staff&&b.owner?textValue(b.owner,'Cliente'):uid;if(!await db.prepare('SELECT id FROM users WHERE id=?').bind(owner).first())return fail('Cliente inexistente.');await db.batch([db.prepare('INSERT INTO pets VALUES(?,?,?,?,?,?)').bind(id,owner,textValue(b.name,'Nombre',80),textValue(b.species,'Especie',60),b.breed?textValue(b.breed,'Raza',80):'',b.birth?dateValue(b.birth):''),log(id)]);}
 else if(action==='book'){
 if(b.consent!==true)return fail('Debe aceptar el tratamiento de datos para la cita.');
 const pet=await db.prepare('SELECT * FROM pets WHERE id=?').bind(b.pet).first();if(!pet||(!staff&&pet.owner!==uid))return fail('Paciente no disponible.',403);
 const slot=await db.prepare('SELECT * FROM slots WHERE id=? AND active=1').bind(b.slot).first();if(!slot||new Date(`${slot.day}T${slot.time}:00-06:00`)<=new Date())return fail('Horario no disponible.',409);
 try{await db.batch([db.prepare("INSERT INTO bookings VALUES(?,?,?,?,?,?)").bind(id,pet.owner,b.pet,b.slot,'confirmed',at),log(id)]);}catch{return fail('Este horario acaba de ocuparse. Seleccione otro.',409);}
 }
 else if(action==='booking-status'){
 const booking=await db.prepare('SELECT * FROM bookings WHERE id=?').bind(b.id).first();if(!booking||(!staff&&booking.owner!==uid))return fail('Acceso restringido.',403);
 if(!['confirmed','completed','cancelled','no-show'].includes(b.status)||(!staff&&b.status!=='cancelled'))return fail('Estado no permitido.',403);
 if(!staff&&booking.status!=='confirmed')return fail('La cita ya fue cerrada.',409);
 try{await db.batch([db.prepare('UPDATE bookings SET status=? WHERE id=?').bind(b.status,b.id),log(b.id)]);}catch{return fail('El horario ya está ocupado.',409);}
 }
 else {if(!staff)return fail('Acceso restringido.',403);
 if(action==='slot'){const day=dateValue(b.day),time=textValue(b.time,'Hora',5);if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||new Date(`${day}T${time}:00-06:00`)<=new Date())return fail('Seleccione una fecha y hora futuras.');await db.batch([db.prepare('INSERT INTO slots VALUES(?,?,?,?,1)').bind(id,day,time,textValue(b.service,'Servicio')),log(id)]);}
 else if(action==='product'){await db.batch([db.prepare('INSERT INTO products VALUES(?,?,?,?,?,?,?,?,?)').bind(id,textValue(b.name,'Producto'),textValue(b.sku,'SKU',80),textValue(b.category,'Categoría',80),textValue(b.lot,'Lote',80),b.expiry?dateValue(b.expiry):'',integerValue(b.stock,'Stock'),integerValue(b.minimum,'Mínimo'),integerValue(b.price,'Precio')),log(id)]);}
 else if(action==='stock'){
 const delta=integerValue(b.delta,'Movimiento',-100000,100000);if(!delta)return fail('El movimiento debe ser distinto de cero.');
 const reason=textValue(b.reason,'Motivo',300);
 try{await db.batch([db.prepare('INSERT INTO movements VALUES(?,?,?,?,?,?)').bind(id,b.id,delta,reason,uid,at),log(b.id)]);}catch{return fail('Producto inexistente o stock insuficiente.',409);}
 }
 else if(action==='record'){const pet=await db.prepare('SELECT * FROM pets WHERE id=?').bind(b.pet).first();if(!pet)return fail('Paciente inexistente.');await db.batch([db.prepare('INSERT INTO records VALUES(?,?,?,?,?,?,?)').bind(id,b.pet,pet.owner,textValue(b.note,'Nota',8000),textValue(b.kind,'Tipo',80),uid,at),log(id)]);}
 else return fail('Acción no disponible.');}
 return Response.json({ok:true,id});
 }catch(e){return fail(e instanceof Error&& !/SQLITE|D1|constraint/i.test(e.message)?e.message:'No se pudo completar la operación. Revise los datos.',400);}
}
