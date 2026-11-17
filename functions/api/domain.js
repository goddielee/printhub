// Domain search + order. Prices are KES per year and are PLACEHOLDERS: edit to your registrar cost + margin.
const PRICES = { com: 1800, 'co.ke': 1200, org: 2000, net: 2200 };
const RDAP = ['com', 'org', 'net']; // TLDs we can check automatically; others are confirmed by you before registering
const NAME = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const json = (d, s = 200) => Response.json(d, { status: s });

async function check(domain, tld) {
  if (!RDAP.includes(tld)) return 'confirm';
  try {
    const r = await fetch('https://rdap.org/domain/' + domain, { signal: AbortSignal.timeout(5000) });
    return r.status === 404 ? 'available' : r.ok ? 'taken' : 'confirm';
  } catch { return 'confirm'; }
}

export async function onRequestGet({ request }) {
  const q = (new URL(request.url).searchParams.get('q') || '').toLowerCase().trim().replace(/\..*$/, '');
  if (!NAME.test(q)) return json({ error: 'Use letters, numbers and hyphens only.' }, 400);
  const results = await Promise.all(Object.keys(PRICES).map(async tld =>
    ({ domain: `${q}.${tld}`, tld, price: PRICES[tld], status: await check(`${q}.${tld}`, tld) })));
  return json({ results });
}

export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  const domain = String(b.domain || '').toLowerCase();
  const [label, ...rest] = domain.split('.');
  const tld = rest.join('.');
  const years = Math.floor(Number(b.years) || 1);
  if (!NAME.test(label) || !PRICES[tld] || years < 1 || years > 3 || !b.name?.trim() || !String(b.email || '').includes('@'))
    return json({ error: 'Check the domain, your name and your email.' }, 400);
  const total = PRICES[tld] * years;
  const r = await env.DB.prepare('INSERT INTO quotes (product,qty,finish,design,total,name,phone) VALUES (?,?,?,?,?,?,?)')
    .bind('domain:' + domain, years, 'domain', 0, total, `${b.name.trim()} (${b.email.trim()})`.slice(0, 150), String(b.phone || '').trim()).run();
  return json({ id: r.meta.last_row_id, total });
}
