// Print quotes. Prices come from ../pricing.js (VAT inclusive).
import { PRODUCTS, FINISH, ZONES, DESIGN_FEE, DEPOSIT, VAT, priceFor } from '../pricing.js';
const json = (d, s = 200) => Response.json(d, { status: s });

export const onRequestGet = () => json({ products: PRODUCTS, zones: ZONES, designFee: DESIGN_FEE, deposit: DEPOSIT, vat: VAT });

export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  const p = PRODUCTS[b.product], z = ZONES[b.zone], qty = Math.floor(Number(b.qty));
  if (!p || !z || !p.finishes.includes(b.finish) || !b.name?.trim()) return json({ error: 'Check the product, finish, delivery and your name.' }, 400);
  if (!(qty <= 100000)) return json({ error: 'For quantities above 100,000 please contact us.' }, 400);
  const base = priceFor(p, qty);
  if (base === null) return json({ error: `The minimum order is ${p.breaks[0][0]} ${p.unit}.` }, 400);
  const items = Math.round(base * FINISH[b.finish]), design = b.design ? DESIGN_FEE : 0, total = items + design + z.fee;
  const r = await env.DB.prepare('INSERT INTO quotes (product,qty,finish,design,total,name,phone,delivery) VALUES (?,?,?,?,?,?,?,?)')
    .bind(b.product, qty, b.finish, design ? 1 : 0, total, b.name.trim(), String(b.phone || '').trim(), z.label).run();
  return json({ id: r.meta.last_row_id, total, items, design, delivery: z.fee, deposit: Math.ceil(total * DEPOSIT), vat: Math.round(total - total / (1 + VAT)) });
}
