// Shared hosting orders (paid in full, yearly). You set the account up after confirming payment.
// A client can also ask us to register their domain and attach a website made in our builder: it all becomes ONE order.
import { HOSTING, DOMAINS } from '../pricing.js';
const json = (d, s = 200) => Response.json(d, { status: s });
export const onRequestGet = () => json({ plans: HOSTING, domains: DOMAINS });

export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({})), plan = HOSTING[b.plan], domain = String(b.domain || '').trim().toLowerCase();
  if (!plan || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain) || !b.name?.trim() || !String(b.email || '').includes('@'))
    return json({ error: 'Check the plan, your domain name, your name and your email.' }, 400);
  const tld = domain.split('.').slice(1).join('.'), reg = b.register ? DOMAINS[tld] : 0;
  if (b.register && !reg) return json({ error: 'We can register .com, .co.ke, .org and .net. Untick the box if you already own this domain.' }, 400);
  let slug = '';
  if (String(b.site || '').trim()) {
    const m = String(b.site).match(/slug=([a-z0-9-]+)&key=([a-f0-9]+)/);
    const s = m && await env.DB.prepare('SELECT slug FROM sites WHERE slug=? AND edit_key=?').bind(m[1], m[2]).first();
    if (!s) return json({ error: 'That website link is not valid. Paste the full edit link from the website builder, or leave it empty.' }, 400);
    slug = s.slug;
  }
  const total = plan.price + (reg || 0);
  const notes = [reg ? `Register domain for client: ${domain} (KES ${reg})` : 'Client already owns the domain', slug ? `Website to upload: ${slug}` : ''].filter(Boolean).join('. ');
  const r = await env.DB.prepare('INSERT INTO quotes (product,qty,finish,design,total,name,phone,notes,site_slug) VALUES (?,?,?,?,?,?,?,?,?)')
    .bind(`hosting:${b.plan}:${domain}`, 1, 'hosting', 0, total, `${b.name.trim()} (${b.email.trim()})`.slice(0, 150), String(b.phone || '').trim(), notes, slug || null).run();
  return json({ id: r.meta.last_row_id, total, hosting: plan.price, domain: reg || 0 });
}
