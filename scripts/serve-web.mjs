/**
 * سرور استاتیک وب + پراکسی /api به بک‌اند (پورت 3000).
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const WEB_DIST = new URL('../apps/web/dist', import.meta.url).pathname;
const API = 'http://127.0.0.1:4000';
const PORT = Number(process.env.PORT ?? 3000);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  if (req.url.startsWith('/api/')) {
    const proxied = await fetch(API + req.url, {
      method: req.method,
      headers: { 'content-type': 'application/json', ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}) },
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? await new Response(req).text() : undefined,
    }).catch(() => null);
    if (!proxied) { res.writeHead(502); res.end('{"error":"بک‌اند در دسترس نیست"}'); return; }
    res.writeHead(proxied.status, { 'content-type': proxied.headers.get('content-type') ?? 'application/json' });
    res.end(await proxied.text());
    return;
  }

  const path = req.url === '/' ? '/index.html' : req.url;
  try {
    const file = await readFile(join(WEB_DIST, path));
    res.writeHead(200, { 'content-type': MIME[extname(path)] ?? 'application/octet-stream' });
    res.end(file);
  } catch {
    // SPA fallback
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(await readFile(join(WEB_DIST, 'index.html')));
  }
});

server.listen(PORT, () => console.log(`TLD web روی پورت ${PORT} اجرا شد`));
