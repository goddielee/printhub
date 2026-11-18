// Manual Paybill payments: the customer pays the bank Paybill, then submits the M-Pesa code for you to verify.
// PAY_ACCOUNT is set in Cloudflare (Settings > Variables and secrets, type Secret) so it stays out of GitHub.
const json = (d, s = 200) => Response.json(d, { status: s });

export async function onRequestGet({ env }) {
  if (!env.PAY_ACCOUNT) return json({ error: 'Payments are not switched on yet. Please contact us on WhatsApp.' }, 503);
  return json({ paybill: env.PAYBILL || '516600', account: env.PAY_ACCOUNT });
}

export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  const code = String(b.code || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(code)) return json({ error: 'The M-Pesa code is 10 letters and numbers, for example SKL2A3B4C5.' }, 400);
  const q = await env.DB.prepare('SELECT id,status FROM quotes WHERE id=?').bind(b.id).first();
  if (!q) return json({ error: 'Order not found.' }, 404);
  if (!['quoted', 'payment_failed', 'payment_submitted'].includes(q.status)) return json({ error: 'This order is already confirmed.' }, 400);
  const dup = await env.DB.prepare('SELECT id FROM quotes WHERE receipt=? AND id!=?').bind(code, q.id).first();
  if (dup) return json({ error: 'That code has already been used on another order.' }, 409);
  await env.DB.prepare("UPDATE quotes SET status='payment_submitted', receipt=? WHERE id=?").bind(code, q.id).run();
  return json({ ok: true });
}
