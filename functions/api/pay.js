// Manual Paybill payments: the customer pays the bank Paybill, then submits the M-Pesa code for you to verify.
// PAY_ACCOUNT is set in Cloudflare (Settings > Variables and secrets, type Secret) so it stays out of GitHub.
import { alert } from '../notify.js';
import { DEPOSIT } from '../pricing.js';
const json = (d, s = 200) => Response.json(d, { status: s });
const last9 = p => String(p || '').replace(/\D/g, '').slice(-9);

export async function onRequestGet({ env }) {
  if (!env.PAY_ACCOUNT) return json({ error: 'Payments are not switched on yet. Please contact us on WhatsApp.' }, 503);
  return json({ paybill: env.PAYBILL || '516600', account: env.PAY_ACCOUNT });
}

export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  const code = String(b.code || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{10}$/.test(code)) return json({ error: 'The M-Pesa code is 10 letters and numbers, for example SKL2A3B4C5.' }, 400);
  const q = await env.DB.prepare('SELECT id,status,phone,finish,product,total FROM quotes WHERE id=?').bind(b.id).first();
  if (!q) return json({ error: 'Order not found.' }, 404);
  const dup = await env.DB.prepare('SELECT id FROM quotes WHERE (receipt=? OR balance_code=?) AND id!=?').bind(code, code, q.id).first();
  if (dup) return json({ error: 'That code has already been used on another order.' }, 409);

  if (b.kind === 'balance') { // paying the remaining 30% of a print order (needs the order's phone number)
    if (last9(b.phone).length < 9 || last9(b.phone) !== last9(q.phone)) return json({ error: 'Order not found. Check the order number and phone number.' }, 404);
    if (['domain', 'site', 'hosting'].includes(q.finish) || !['deposit_paid', 'in_production', 'ready'].includes(q.status))
      return json({ error: 'There is no balance to pay on this order right now.' }, 400);
    await env.DB.prepare('UPDATE quotes SET balance_code=? WHERE id=?').bind(code, q.id).run();
    await alert(env, `Balance code submitted\nOrder #${q.id} (${q.product})\nExpected balance: KES ${q.total - Math.ceil(q.total * DEPOSIT)}\nCode: ${code}\nVerify it in your dashboard.`);
    return json({ ok: true });
  }
  if (!['quoted', 'payment_failed', 'payment_submitted'].includes(q.status)) return json({ error: 'This order is already confirmed.' }, 409);
  await env.DB.prepare("UPDATE quotes SET status='payment_submitted', receipt=? WHERE id=?").bind(code, q.id).run();
  const expected = ['domain', 'site', 'hosting'].includes(q.finish) ? q.total : Math.ceil(q.total * DEPOSIT);
  await alert(env, `Payment code submitted\nOrder #${q.id} (${q.product})\nExpected: KES ${expected}\nCode: ${code}\nVerify it in your dashboard.`);
  return json({ ok: true });
}
