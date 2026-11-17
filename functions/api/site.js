// DIY website builder API: preview, save draft, start publishing, load a draft.
import { clean, renderSite } from '../render.js';
const PRICE = 3000; // KES to publish a site: PLACEHOLDER, set your own (also update the button text in builder.html)
const json = (d, s = 200) => Response.json(d, { status: s });
const rand = n => crypto.randomUUID().replace(/-/g, '').slice(0, n);
const slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'site';

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const s = await env.DB.prepare('SELECT owner,data,status FROM sites WHERE slug=? AND edit_key=?').bind(u.searchParams.get('slug'), u.searchParams.get('key')).first();
  return s ? json({ owner: s.owner, data: JSON.parse(s.data), status: s.status, price: PRICE }) : json({ error: 'Not found.' }, 404);
}

export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  if (b.action === 'preview') return new Response(renderSite(b.data), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

  if (b.action === 'save') {
    const d = clean(b.data), owner = String(b.owner || '').trim().slice(0, 60);
    if (!owner) return json({ error: 'Enter your name first.' }, 400);
    if (b.slug) {
      const r = await env.DB.prepare('UPDATE sites SET data=?,template=?,owner=?,phone=?,updated=CURRENT_TIMESTAMP WHERE slug=? AND edit_key=?')
        .bind(JSON.stringify(d), d.template, owner, d.phone, b.slug, b.key).run();
      return r.meta.changes ? json({ slug: b.slug, key: b.key }) : json({ error: 'Could not update this site.' }, 403);
    }
    const slug = slugify(d.name) + '-' + rand(3), key = rand(24);
    await env.DB.prepare('INSERT INTO sites (slug,edit_key,owner,phone,template,data) VALUES (?,?,?,?,?,?)').bind(slug, key, owner, d.phone, d.template, JSON.stringify(d)).run();
    return json({ slug, key });
  }

  if (b.action === 'publish') {
    const s = await env.DB.prepare('SELECT owner,status FROM sites WHERE slug=? AND edit_key=?').bind(b.slug, b.key).first();
    if (!s) return json({ error: 'Site not found.' }, 404);
    if (s.status === 'published') return json({ error: 'This site is already published.' }, 400);
    const r = await env.DB.prepare('INSERT INTO quotes (product,qty,finish,design,total,name,phone) VALUES (?,?,?,?,?,?,?)')
      .bind('site:' + b.slug, 1, 'site', 0, PRICE, s.owner, String(b.phone || '')).run();
    return json({ id: r.meta.last_row_id, total: PRICE });
  }
  return json({ error: 'Unknown action.' }, 400);
}
