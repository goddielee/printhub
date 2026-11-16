// Routes /api/* to the handlers; everything else is served from /public by Cloudflare.
import * as quote from './functions/api/quote.js';
import * as mpesa from './functions/api/mpesa.js';
import * as callback from './functions/api/callback.js';
import * as admin from './functions/api/admin.js';

const routes = { '/api/quote': quote, '/api/mpesa': mpesa, '/api/callback': callback, '/api/admin': admin };

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const mod = routes[pathname];
    if (!mod) return env.ASSETS.fetch(request);
    const handler = request.method === 'GET' ? mod.onRequestGet : request.method === 'POST' ? mod.onRequestPost : null;
    return handler ? handler({ request, env }) : new Response('Method not allowed', { status: 405 });
  },
};
