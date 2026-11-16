// Owner-only endpoints. Protected by the ADMIN_TOKEN secret set in Cloudflare.
const STATUSES = ['quoted', 'deposit_paid', 'payment_failed', 'in_production', 'ready', 'delivered'];
const authorised = (request, env) => {
  const t = (request.headers.get('Authorization') || '').replace('Bearer ', '');
  return !!env.ADMIN_TOKEN && t.length === env.ADMIN_TOKEN.length && t === env.ADMIN_TOKEN;
};
const deny = () => Response.json({ error: 'Wrong access key.' }, { status: 401 });

export async function onRequestGet({ request, env }) {
  if (!authorised(request, env)) return deny();
  const { results } = await env.DB.prepare(
    'SELECT id,product,qty,finish,design,total,name,phone,status,receipt,created FROM quotes ORDER BY id DESC LIMIT 200').all();
  return Response.json({ orders: results, statuses: STATUSES });
}

export async function onRequestPost({ request, env }) {
  if (!authorised(request, env)) return deny();
  const { id, status } = await request.json().catch(() => ({}));
  if (!id || !STATUSES.includes(status)) return Response.json({ error: 'Invalid update.' }, { status: 400 });
  await env.DB.prepare('UPDATE quotes SET status=? WHERE id=?').bind(status, id).run();
  return Response.json({ ok: true });
}
