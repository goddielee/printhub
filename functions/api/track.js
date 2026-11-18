// Customer order tracking. An order is only shown when the order number AND the phone number match.
const json = (d, s = 200) => Response.json(d, { status: s });
const last9 = p => String(p || '').replace(/\D/g, '').slice(-9);
const PRINT = ['Order received', 'Deposit confirmed', 'In production', 'Ready', 'Completed'];
const OTHER = ['Order received', 'Payment confirmed', 'Completed'];
const EARLY = ['quoted', 'payment_submitted', 'payment_failed'];
const LABEL = {
  quoted: 'Waiting for your payment', payment_submitted: 'We received your payment details and are confirming them',
  payment_failed: 'We could not confirm your payment. Please check your M-Pesa code or contact us',
  deposit_paid: 'Payment confirmed', in_production: 'In production', ready: 'Ready for collection or delivery',
  balance_paid: 'Fully paid and ready to hand over', delivered: 'Completed. Thank you!',
};

export async function onRequestGet({ request, env }) {
  const u = new URL(request.url), id = Number(u.searchParams.get('id')), phone = last9(u.searchParams.get('phone'));
  const nope = () => json({ error: 'We could not find that order. Check the order number and the phone number you used.' }, 404);
  if (!Number.isInteger(id) || id < 1 || phone.length < 9) return nope();
  const o = await env.DB.prepare('SELECT id,product,qty,finish,total,phone,status,created FROM quotes WHERE id=?').bind(id).first();
  if (!o || last9(o.phone) !== phone) return nope();

  const s = o.status, full = o.finish === 'domain' || o.finish === 'site', dep = Math.ceil(o.total / 2);
  const isSite = o.product.startsWith('site:'), slug = isSite ? o.product.slice(5) : '';
  let link = null, step;
  if (EARLY.includes(s)) step = 0;
  else if (isSite) {
    const st = await env.DB.prepare('SELECT status FROM sites WHERE slug=?').bind(slug).first();
    if (st?.status === 'published') link = '/s/' + slug;
    step = link ? 2 : 1;
  } else if (full) step = s === 'delivered' ? 2 : 1;
  else step = { deposit_paid: 1, in_production: 2, ready: 3, balance_paid: 3, delivered: 4 }[s] ?? 1;

  let due = 0, dueLabel = '';
  if (EARLY.includes(s)) { due = full ? o.total : dep; dueLabel = full ? 'Amount due' : 'Deposit due'; }
  else if (!full && ['deposit_paid', 'in_production', 'ready'].includes(s)) { due = o.total - dep; dueLabel = 'Balance due on collection or delivery'; }
  const item = o.product.startsWith('domain:') ? 'Domain ' + o.product.slice(7) : isSite ? 'Website' : `${o.qty} x ${o.product}`;
  return json({ id: o.id, item, label: link ? 'Your website is live' : (LABEL[s] || s), steps: full ? OTHER : PRINT, step, total: o.total, due, dueLabel, created: o.created, link });
}
