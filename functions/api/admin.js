import { renderSite } from '../render.js';
// Owner-only endpoints. Protected by the ADMIN_TOKEN secret set in Cloudflare.
const STATUSES = ['quoted', 'payment_submitted', 'deposit_paid', 'payment_failed', 'in_production', 'ready', 'balance_paid', 'delivered'];
const authorised = (request, env) => {
  const t = (request.headers.get('Authorization') || '').replace('Bearer ', '');
  return !!env.ADMIN_TOKEN && t.length === env.ADMIN_TOKEN.length && t === env.ADMIN_TOKEN;
};
const deny = () => Response.json({ error: 'Wrong access key.' }, { status: 401 });

export async function onRequestGet({ request, env }) {
  if (!authorised(request, env)) return deny();
  const ex = new URL(request.url).searchParams.get('export');
  if (ex) { // download a client's website as a ready-to-upload index.html
    const s = await env.DB.prepare('SELECT data FROM sites WHERE slug=?').bind(ex).first();
    if (!s) return json({ error: 'Site not found.' }, 404);
    return new Response(renderSite(JSON.parse(s.data)), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': `attachment; filename="${ex.replace(/[^a-z0-9-]/g, '')}-index.html"` } });
  }
  const { results } = await env.DB.prepare(
    'SELECT id,product,qty,finish,design,total,name,phone,delivery,notes,site_slug,balance_code,status,receipt,created FROM quotes ORDER BY id DESC LIMIT 200').all();
  return Response.json({ orders: results, statuses: STATUSES });
}

export async function onRequestPost({ request, env }) {
  if (!authorised(request, env)) return deny();
  const { id, status } = await request.json().catch(() => ({}));
  if (!id || !STATUSES.includes(status)) return Response.json({ error: 'Invalid update.' }, { status: 400 });
  await env.DB.prepare('UPDATE quotes SET status=? WHERE id=?').bind(status, id).run();
  const q = await env.DB.prepare('SELECT product FROM quotes WHERE id=?').bind(id).first();
  if (q?.product?.startsWith('site:')) // any paid status puts the site live; going back to unpaid takes it down
    await env.DB.prepare('UPDATE sites SET status=? WHERE slug=?').bind(['deposit_paid', 'in_production', 'ready', 'balance_paid', 'delivered'].includes(status) ? 'published' : 'draft', q.product.slice(5)).run();
  return Response.json({ ok: true });
}
