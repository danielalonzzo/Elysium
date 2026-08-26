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

Uno por cada dominio público. Los tres son puntos de entrada de la misma
organización y los tres pueden ser el resultado de una visita a `.eu`: el
reparto geográfico manda España a `.es` y Portugal a `.pt`. Publicar solo el
registro europeo deja el descubrimiento roto justo después de esa redirección.

No se publica `_a2a._agents`: Elysium no expone un agente A2A, y un registro
que apunte a algo que no existe es peor que no tenerlo. El servidor MCP de
solo lectura ya queda inventariado por el catálogo al que lleva el índice.

```dns
_index._agents.elysiumdr.eu. 3600 IN SVCB 1 elysiumdr.eu. (
    alpn="h2" port=443 mandatory=alpn,port )

_index._agents.elysiumdr.es. 3600 IN SVCB 1 elysiumdr.es. (
    alpn="h2" port=443 mandatory=alpn,port )

_index._agents.elysiumdr.pt. 3600 IN SVCB 1 elysiumdr.pt. (
    alpn="h2" port=443 mandatory=alpn,port )
```

Seis cosas que hay que respetar al copiarlos:

1. **`mandatory` lleva solo `alpn,port`.** Es lo más fácil de estropear.
   Bajo la RFC 9460 un cliente que no entienda una clave listada en `mandatory`
   **tiene que ignorar el registro entero**.
2. **Sin claves experimentales inventadas.** `cap`, `well-known` y `bap` aún no
   tienen números de IANA. Si algún día se incorporan, la forma de zona será
   `keyNNNNN` y el número deberá salir del rango privado 65280–65534 o de una
   asignación oficial; nunca se meterá esa clave experimental en `mandatory`.
3. **SVCB y prioridad 1.** El tipo 64 es el registro nativo del borrador y una
   prioridad distinta de cero lo pone en ServiceMode. Con prioridad 0 los
   parámetros se ignorarían por ser AliasMode.
4. **Destino absoluto y sin guiones bajos.** El punto final de
   `elysiumdr.eu.`/`.es.`/`.pt.` evita que el panel añada otra vez el nombre de
   la zona, y además deja un nombre válido para el certificado TLS.
5. **Un ALPN real.** `h2` es un protocolo que el extremo HTTPS negocia de
   verdad. `mcp` y `a2a` siguen siendo propuestas sin registro IANA y no deben
   anunciarse como si Cloudflare los negociara en TLS.
6. **Sin proxy (nube gris).** Un registro SVCB bajo `_agents` es de solo DNS;
   Cloudflare no lo puede pasar por el proxy.

## Cómo se ponen

Lo aplica **`scripts/publish-dns-aid.sh`**, que es la forma de no copiar tres
veces el mismo valor a mano. Lee las zonas, actualiza el registro si ya existe
en vez de añadir un segundo al mismo RRset, y comprueba por DoH tanto el RDATA
exacto como la cadena DNSSEC (`AD=true`):

```bash
CF_DNS_TOKEN=… ./scripts/publish-dns-aid.sh     # crea o corrige los tres
./scripts/publish-dns-aid.sh --check            # solo comprueba, sin token
```

La comprobación devuelve error mientras falte cualquiera de los tres registros,
si un registro tiene otro destino o parámetros, o mientras la zona no forme una
cadena DNSSEC autenticada hasta su DS en el registrador. Que Cloudflare ya
muestre la zona como firmada no basta si el padre aún no publica el DS.

El token sale de Cloudflare → *My Profile* → *API Tokens* → *Create Token* →
**Edit zone DNS**, con las tres zonas en *Zone Resources*. El de `wrangler` no
vale: solo trae `zone (read)` y la creación devuelve 403.

A mano, en el panel: repetir en **elysiumdr.eu**, **elysiumdr.es** y
**elysiumdr.pt**: **DNS → Records → Add record**, tipo `SVCB`. La prioridad es
`1`, el destino es el ápice de esa misma zona y el valor es
`alpn="h2" port=443 mandatory=alpn,port`.

Por API, en crudo:

```bash
ZONE=$(curl -s "https://api.cloudflare.com/client/v4/zones?name=elysiumdr.eu" \
  -H "Authorization: Bearer $CF_DNS_TOKEN" | python3 -c 'import json,sys;print(json.load(sys.stdin)["result"][0]["id"])')

curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records" \
  -H "Authorization: Bearer $CF_DNS_TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"SVCB","name":"_index._agents.elysiumdr.eu","ttl":3600,
       "content":"1 elysiumdr.eu. alpn=\"h2\" port=443 mandatory=alpn,port"}'
```

El ejemplo crea el europeo. Hay que repetirlo con la zona, el nombre y el
destino `.es` y `.pt`; antes de crear nada, listar los registros de la zona para
no duplicar un RRset que ya exista.

## DNSSEC

**Ahora mismo ninguna de las tres zonas está firmada** — las consultas DS de
`.eu`, `.es` y `.pt` no devuelven nada. Sin firma, un resolutor validante no
puede distinguir estos registros de unos inventados por quien esté en medio,
que es justo lo que DNS-AID pide evitar.

Son tres pasos y el segundo no es de Cloudflare:

1. En cada zona de Cloudflare: **DNS → Settings → DNSSEC → Enable**. Cloudflare
   da entonces un registro DS distinto para cada dominio. También puede
   activarse con `PATCH /zones/{zone_id}/dnssec`; el script de publicación no lo
   hace porque el paso siguiente sigue siendo externo a Cloudflare.
2. Dar de alta cada DS **en el registrador del dominio correspondiente**. Hasta
   que `.eu`, `.es` y `.pt` publiquen su DS en la zona padre, la firma no forma
   una cadena de confianza.
3. Esperar a que aparezcan DS, DNSKEY y RRSIG antes de validar. Ver un RRSIG sin
   la bandera `AD` no demuestra una cadena autenticada.

## Comprobar

```bash
dig @1.1.1.1 _index._agents.elysiumdr.eu TYPE64 +dnssec
dig @1.1.1.1 _index._agents.elysiumdr.es TYPE64 +dnssec
dig @1.1.1.1 _index._agents.elysiumdr.pt TYPE64 +dnssec
dig @1.1.1.1 elysiumdr.eu DS +dnssec
dig @1.1.1.1 elysiumdr.es DS +dnssec
dig @1.1.1.1 elysiumdr.pt DS +dnssec

delv @1.1.1.1 _index._agents.elysiumdr.eu SVCB
```

Se usa `TYPE64` en `dig` porque la versión incluida en algunos macOS todavía
no reconoce el nombre mnemónico `SVCB`; ambos representan el mismo tipo DNS.

Quien comprueba desde fuera lo hace por DNS-over-HTTPS, no por el resolutor del
sistema, así que conviene mirarlo también por ahí:

```bash
curl -s -H 'accept: application/dns-json' \
  'https://cloudflare-dns.com/dns-query?name=_index._agents.elysiumdr.eu&type=64'
```

La respuesta final debe tener `Status: 0`, `AD: true` y un `Answer` de tipo 64.
Después se comprueban por separado los tres dominios con el escáner público;
el caché negativo de un NXDOMAIN anterior puede tardar hasta el TTL del SOA en
desaparecer.
