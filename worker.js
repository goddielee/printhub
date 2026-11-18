// Routes /api/* to the handlers; everything else is served from /public by Cloudflare.
import * as quote from './functions/api/quote.js';
import * as mpesa from './functions/api/mpesa.js';
import * as callback from './functions/api/callback.js';
import * as admin from './functions/api/admin.js';
import * as domain from './functions/api/domain.js';
import * as site from './functions/api/site.js';
import * as pay from './functions/api/pay.js';
import { renderSite } from './functions/render.js';

const routes = { '/api/quote': quote, '/api/mpesa': mpesa, '/api/callback': callback, '/api/admin': admin, '/api/domain': domain, '/api/site': site, '/api/pay': pay };

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/s/')) return serveSite(pathname.slice(3).replace(/\/$/, ''), env);
    const mod = routes[pathname];
    if (!mod) return env.ASSETS.fetch(request);
    const handler = request.method === 'GET' ? mod.onRequestGet : request.method === 'POST' ? mod.onRequestPost : null;
    return handler ? handler({ request, env }) : new Response('Method not allowed', { status: 405 });
  },
};

async function serveSite(slug, env) {
  const s = /^[a-z0-9-]+$/.test(slug) ? await env.DB.prepare('SELECT data,status FROM sites WHERE slug=?').bind(slug).first() : null;
  const html = (b, st) => new Response(b, { status: st, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  if (s && s.status === 'published') return html(renderSite(JSON.parse(s.data)), 200);
  return html('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:18px system-ui;text-align:center;padding:80px 20px"><h1>This site is not live yet</h1><p>Please check back soon.</p>', 404);
}
