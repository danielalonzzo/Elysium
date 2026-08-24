# DNS-AID — el descubrimiento que no vive en el repositorio

Todo lo demás que lee un agente son ficheros: `/.well-known/`, `/llms.txt`,
`/mcp`. Esto no. **DNS-AID se publica en la zona DNS**, así que no se despliega
con un push y no hay forma de arreglarlo desde aquí: hay que tocar Cloudflare.
Este fichero existe para que los registros se pongan exactamente como toca y no
haya que volver a deducirlos.

Vive en `scripts/` a propósito, que es de las dos carpetas que las tres listas
de despliegue excluyen enteras. No es una página.

## Por qué

Las cuatro vías de descubrimiento contestan preguntas distintas:

| Vía | Responde a |
|---|---|
| `/.well-known/ai-catalog.json` | «ya estoy en el sitio, ¿qué ofrece?» |
| `<link rel="ai-catalog">` | lo mismo, para quien ya abrió el HTML |
| `robots.txt` → `Agentmap:` | lo mismo, para quien solo lee robots.txt |
| **DNS-AID** | **«¿este dominio tiene agentes?», antes de la primera petición HTTP** |

Solo la última se contesta sin descargar nada del sitio. Es también la única que
un resolutor puede autenticar, si la zona está firmada.

## Los registros

Tres. Ni uno más: no se publica `_a2a._agents` porque Elysium no expone ningún
agente A2A, y un registro que apunte a algo que no existe es peor que no
tenerlo.

```dns
; Punto de entrada. Es el que se comprueba desde fuera.
_index._agents.elysiumdr.eu.   3600 IN HTTPS 1 elysiumdr.eu. (
    alpn="h2,http/1.1" port=443 mandatory=alpn,port
    key65001="cap=https://elysiumdr.eu/.well-known/ai-catalog.json" )

; El servidor MCP de solo lectura que ya sirve el Worker en /mcp.
_mcp._agents.elysiumdr.eu.     3600 IN HTTPS 1 elysiumdr.eu. (
    alpn="h2,http/1.1" port=443 mandatory=alpn,port
    key65001="cap=urn:air:elysiumdr.eu:mcp:site" )

; El manifiesto ARD por DNS (spec ARD §6.1), para quien pregunte por TXT.
_catalog._agents.elysiumdr.eu. 3600 IN TXT
    "url=https://elysiumdr.eu/.well-known/ai-catalog.json"
```

Cuatro cosas que hay que respetar al copiarlos:

1. **`mandatory` lleva solo `alpn,port`.** Es lo más fácil de estropear.
   Bajo la RFC 9460 un cliente que no entienda una clave listada en `mandatory`
   **tiene que ignorar el registro entero**. Como `key65001` es experimental, no
   la entiende casi nadie: meterla ahí haría invisible el registro justo para
   quien viene a leerlo. Va como parámetro suelto, opcional.
2. **`key65001` en forma numérica.** El borrador la llama `cap`, pero hasta que
   IANA la registre la forma de presentación tiene que ser `keyNNNNN`. Si el
   panel de Cloudflare no acepta el parámetro, quítalo: los registros siguen
   siendo válidos sin él.
3. **HTTPS, no SVCB.** El borrador pide la variante HTTPS cuando el extremo lo
   es, para que los parámetros de transporte viajen con los de capacidad.
4. **Sin proxy (nube gris).** Un registro HTTPS bajo `_agents` es de solo DNS;
   Cloudflare no lo puede pasar por el proxy.

## Cómo se ponen

En el panel: **elysiumdr.eu → DNS → Records → Add record**, tipo `HTTPS` para
los dos primeros y `TXT` para el tercero. Cloudflare pide *priority*, *target* y
*value* por separado: la prioridad es `1`, el destino `elysiumdr.eu` y el resto
de la línea va en *value*.

Por API, con un token de `Zone.DNS Edit` (el de `wrangler` no vale, solo trae
`zone (read)`):

```bash
ZONE=$(curl -s "https://api.cloudflare.com/client/v4/zones?name=elysiumdr.eu" \
  -H "Authorization: Bearer $CF_DNS_TOKEN" | python3 -c 'import json,sys;print(json.load(sys.stdin)["result"][0]["id"])')

curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records" \
  -H "Authorization: Bearer $CF_DNS_TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"HTTPS","name":"_index._agents.elysiumdr.eu","ttl":3600,
       "data":{"priority":1,"target":"elysiumdr.eu",
               "value":"alpn=\"h2,http/1.1\" port=443 mandatory=alpn,port"}}'
```

## DNSSEC

**Ahora mismo la zona no está firmada** — `dig DS elysiumdr.eu` no devuelve
nada. Sin firma, un resolutor validante no puede distinguir estos registros de
unos inventados por quien esté en medio, que es justo lo que DNS-AID pide
evitar.

Son dos pasos y el segundo no es de Cloudflare:

1. Cloudflare → **DNS → Settings → DNSSEC → Enable**. Cloudflare da entonces un
   registro DS.
2. Ese DS hay que darlo de alta **en el registrador del dominio `.eu`**. Hasta
   que el registrador lo publique en la zona padre, la firma no sirve de nada.

## Comprobar

```bash
dig +short HTTPS _index._agents.elysiumdr.eu
dig +short HTTPS _mcp._agents.elysiumdr.eu
dig +short TXT   _catalog._agents.elysiumdr.eu
dig +short DS    elysiumdr.eu          # vacío = zona sin firmar
```

Quien comprueba desde fuera lo hace por DNS-over-HTTPS, no por el resolutor del
sistema, así que conviene mirarlo también por ahí:

```bash
curl -s -H 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=_index._agents.elysiumdr.eu&type=HTTPS'
```
