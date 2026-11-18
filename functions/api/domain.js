// Domain search + order. Prices are KES per year and are PLACEHOLDERS: edit to your registrar cost + margin.
const PRICES = { com: 1800, 'co.ke': 1200, org: 2000, net: 2200 };
const RDAP = ['com', 'org', 'net']; // endings with a registry lookup; others (e.g. co.ke) stay 'likely' until you confirm
const NAME = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const json = (d, s = 200) => Response.json(d, { status: s });

// A domain with DNS records is registered. NXDOMAIN only means "not delegated", so it is never proof of availability.
async function dnsExists(domain) {
  try {
    const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=NS`, { headers: { accept: 'application/dns-json' }, signal: AbortSignal.timeout(4000) });
    const j = await r.json();
    if (j.Status === 3) return false;
    return j.Status === 0 || j.Status === 2 ? true : null;
  } catch { return null; }
}

// Returns 'taken', 'available' (two checks agree) or 'likely' (we confirm with the registry before registering).
async function check(domain, tld) {
  if (await dnsExists(domain)) return 'taken';
  if (RDAP.includes(tld)) {
    try {
      const r = await fetch('https://rdap.org/domain/' + domain, { signal: AbortSignal.timeout(5000) });
      if (r.status === 404) return 'available';
      if (r.ok) return 'taken';
    } catch {}
  }
  return 'likely';
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
