'use strict';
// Public downloads use a loopback HTTP proxy. Each outbound connection resolves
// and pins a public IP; redirects cannot reach metadata or private networks.
const http = require('node:http');
const net = require('node:net');
const dns = require('node:dns/promises');
const { isPrivateAddress, isBlockedHostname } = require('./video');

async function publicTarget(value, { tunnel = false, lookup = dns.lookup } = {}) {
  const url = new URL(tunnel ? `https://${value}` : value);
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80));
  if (url.username || url.password || !['http:', 'https:'].includes(url.protocol)
      || ![80, 443].includes(port) || (tunnel && port !== 443) || isBlockedHostname(host)) {
    throw new Error('Blocked destination');
  }
  const addresses = net.isIP(host) ? [{ address: host, family: net.isIP(host) }] : await lookup(host, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(item => isPrivateAddress(item.address))) throw new Error('Blocked destination');
  return { url, host, port, ...addresses[0] };
}

function createPublicNetwork({ lookup = dns.lookup } = {}) {
  const sockets = new Set();
  const track = socket => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)); return socket; };
  const server = http.createServer(async (request, response) => {
    let target;
    try { target = await publicTarget(request.url, { lookup }); } catch { response.writeHead(403).end(); return; }
    if (target.url.protocol !== 'http:') { response.writeHead(400).end(); return; }
    const headers = { ...request.headers, host: target.url.host };
    delete headers['proxy-authorization']; delete headers['proxy-connection'];
    const upstream = http.request({ hostname: target.address, family: target.family, port: target.port,
      method: request.method, path: target.url.pathname + target.url.search, headers, agent: false }, incoming => {
      response.writeHead(incoming.statusCode, incoming.headers); incoming.pipe(response);
    });
    upstream.setTimeout(30000, () => upstream.destroy());
    upstream.on('socket', track);
    upstream.on('error', () => { if (!response.headersSent) response.writeHead(502); response.end(); });
    response.on('close', () => upstream.destroy());
    request.pipe(upstream);
  });
  server.on('connection', track);
  server.on('connect', async (request, client, head) => {
    let target;
    try { target = await publicTarget(request.url, { tunnel: true, lookup }); } catch { client.end('HTTP/1.1 403 Forbidden\r\n\r\n'); return; }
    if (client.destroyed) return;
    const remote = track(net.connect({ host: target.address, port: target.port, family: target.family }));
    remote.setTimeout(30 * 60 * 1000, () => remote.destroy());
    remote.once('connect', () => {
      if (client.destroyed) { remote.destroy(); return; }
      client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head.length) remote.write(head);
      remote.pipe(client); client.pipe(remote);
    });
    remote.on('error', () => client.destroy());
    client.on('error', () => remote.destroy());
    client.on('close', () => remote.destroy());
  });
  server.maxConnections = 128;
  server.requestTimeout = 30000;
  let starting;
  return {
    start() {
      starting ??= new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`));
      });
      return starting;
    },
    async close() { for (const socket of sockets) socket.destroy(); if (server.listening) await new Promise(resolve => server.close(resolve)); }
  };
}
module.exports = { createPublicNetwork, publicTarget };
