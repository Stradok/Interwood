// Local dev server: serves public/ and mounts api/chat.js. Vercel uses the same files natively.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import chat from './api/chat.js';

const root = fileURLToPath(new URL('./public/', import.meta.url));
try { process.loadEnvFile(fileURLToPath(new URL('./.env', import.meta.url))); } catch {}
const types = { '.html': 'text/html; charset=utf-8', '.png': 'image/png' };

createServer(async (req, res) => {
  const path = new URL(req.url, 'http://x').pathname;
  if (path === '/api/chat') {
    let body = '';
    for await (const c of req) { body += c; if (body.length > 20000) return res.writeHead(413).end(); }
    try { req.body = JSON.parse(body); } catch { req.body = {}; }
    res.status = c => (res.statusCode = c, res);
    res.json = o => res.setHeader('content-type', 'application/json').end(JSON.stringify(o));
    return chat(req, res);
  }
  const file = join(root, normalize(path === '/' ? '/index.html' : path));
  if (!file.startsWith(root)) return res.writeHead(404).end();
  try { res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' }).end(await readFile(file)); }
  catch { res.writeHead(404).end('Not found'); }
}).listen(process.env.PORT || 3000, () => console.log('http://localhost:3000'));
