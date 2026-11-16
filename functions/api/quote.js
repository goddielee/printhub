// Prices are in KES and are PLACEHOLDERS: edit to match your trade printers + margin.
export const PRODUCTS = {
  card:    { name: 'Business cards (per 100)', unit: 1200, step: 100 },
  flyer:   { name: 'A5 flyers (each)',         unit: 15,   step: 1 },
  banner:  { name: 'Roll-up banner (each)',    unit: 4500, step: 1 },
  sticker: { name: 'Stickers (each)',          unit: 25,   step: 1 },
  tshirt:  { name: 'Branded T-shirt (each)',   unit: 900,  step: 1 },
};
const FINISH = { standard: 1, matte: 1.1, laminated: 1.25 };
const DESIGN_FEE = 1500;
const json = (d, s = 200) => Response.json(d, { status: s });

export const onRequestGet = () =>
  json({ products: Object.fromEntries(Object.entries(PRODUCTS).map(([k, v]) => [k, v.name])), finishes: Object.keys(FINISH), designFee: DESIGN_FEE });

export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  const p = PRODUCTS[b.product], f = FINISH[b.finish];
  const qty = Math.floor(Number(b.qty));
  if (!p || !f || !(qty > 0 && qty <= 100000) || !b.name?.trim()) return json({ error: 'Check product, quantity, finish and name.' }, 400);
  const total = Math.round(Math.ceil(qty / p.step) * p.unit * f) + (b.design ? DESIGN_FEE : 0);
  const r = await env.DB.prepare('INSERT INTO quotes (product,qty,finish,design,total,name,phone) VALUES (?,?,?,?,?,?,?)')
    .bind(b.product, qty, b.finish, b.design ? 1 : 0, total, b.name.trim(), (b.phone || '').trim()).run();
  return json({ id: r.meta.last_row_id, total, deposit: Math.ceil(total / 2) });
}
