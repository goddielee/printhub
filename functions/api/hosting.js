// Shared hosting orders (paid in full, yearly). You set the account up after confirming payment.
import { HOSTING } from '../pricing.js';
const json = (d, s = 200) => Response.json(d, { status: s });
export const onRequestGet = () => json({ plans: HOSTING });

export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({})), plan = HOSTING[b.plan], domain = String(b.domain || '').trim().toLowerCase();
  if (!plan || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain) || !b.name?.trim() || !String(b.email || '').includes('@'))
    return json({ error: 'Check the plan, your domain name, your name and your email.' }, 400);
  const r = await env.DB.prepare('INSERT INTO quotes (product,qty,finish,design,total,name,phone) VALUES (?,?,?,?,?,?,?)')
    .bind(`hosting:${b.plan}:${domain}`, 1, 'hosting', 0, plan.price, `${b.name.trim()} (${b.email.trim()})`.slice(0, 150), String(b.phone || '').trim()).run();
  return json({ id: r.meta.last_row_id, total: plan.price });
}
