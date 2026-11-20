// Turns a client's site details into a finished, professional web page. Everything typed by clients is escaped or validated.
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const url = v => { v = String(v ?? '').trim(); return /^https:\/\/[^\s"'<>()\\]{3,300}$/.test(v) ? v : ''; };
const hex = v => /^#[0-9a-f]{6}$/i.test(v) ? String(v).toLowerCase() : '#841813';
const mix = (h, t, to) => { const n = parseInt(h.slice(1), 16), k = to === 'w' ? 255 : 0; return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(x => Math.round(x + (k - x) * t).toString(16).padStart(2, '0')).join(''); };
const lum = h => { const n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
const lines = (v, n, m) => (Array.isArray(v) ? v : String(v ?? '').split('\n')).map(x => typeof x === 'string' ? x.trim().slice(0, m) : x).filter(Boolean).slice(0, n);

export function clean(d = {}) {
  const t = (v, n) => String(v ?? '').trim().slice(0, n);
  const pair = (x, a, b) => {
    if (x && typeof x === 'object') return { [a]: t(x[a], 90), [b]: t(x[b], 220) };
    const [p, ...r] = String(x).split('|'); return { [a]: t(p, 90), [b]: t(r.join('|'), 220) };
  };
  return {
    template: ['modern', 'bold', 'elegant'].includes(d.template) ? d.template : 'modern',
    name: t(d.name, 60) || 'Your Business', tagline: t(d.tagline, 120), about: t(d.about, 1000),
    services: lines(d.services, 9, 320).map(x => pair(x, 't', 'd')).filter(x => x.t),
    reviews: lines(d.reviews, 3, 320).map(x => pair(x, 'q', 'n')).filter(x => x.q),
    hours: lines(d.hours, 7, 60), phone: t(d.phone, 20).replace(/[^\d+]/g, ''), email: t(d.email, 80), address: t(d.address, 140),
    facebook: url(d.facebook), instagram: url(d.instagram), tiktok: url(d.tiktok), x: url(d.x),
    heroImage: url(d.heroImage), logo: url(d.logo), color: hex(d.color),
  };
}

export function renderSite(raw, origin = '') {
  const d = clean(raw), c = d.color, dark = mix(c, 0.38, 'b'), tint = mix(c, 0.92, 'w'), on = lum(c) > 0.62 ? '#1a1412' : '#ffffff';
  const wa = d.phone.replace(/\D/g, '').replace(/^0/, '254'), img = !!d.heroImage, tpl = d.template;
  const maps = d.address ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(d.address) : '';
  const social = [['Facebook', d.facebook], ['Instagram', d.instagram], ['TikTok', d.tiktok], ['X', d.x]].filter(s => s[1]).map(s => `<a href="${e(s[1])}" rel="noopener" target="_blank">${s[0]}</a>`).join('');
  const links = [d.about && ['About', '#about'], d.services.length && ['Services', '#services'], d.reviews.length && ['Reviews', '#reviews'], ['Contact', '#contact']].filter(Boolean).map(l => `<a href="${l[1]}">${l[0]}</a>`).join('');
  const hasFacts = d.address || d.hours.length || d.phone || d.email;
  const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'LocalBusiness', name: d.name, description: d.tagline || undefined, telephone: d.phone || undefined, email: d.email || undefined, address: d.address || undefined, image: d.heroImage || d.logo || undefined }).replace(/</g, '\\u003c');
  const formTarget = JSON.stringify(wa ? `https://wa.me/${wa}?text=` : `mailto:${d.email}?subject=Website enquiry&body=`).replace(/</g, '\\u003c');
  const TPL = {
    modern: img ? `.hero .w{display:grid;grid-template-columns:1.1fr .9fr;gap:44px;align-items:center}.himg{border-radius:24px;aspect-ratio:4/3;object-fit:cover;width:100%;box-shadow:0 24px 60px rgba(27,23,21,.2)}@media(max-width:760px){.hero .w{grid-template-columns:1fr}}` : '',
    bold: `.hero{background:${img ? `linear-gradient(135deg,${dark}ee,${c}b8),url("${d.heroImage}") center/cover` : `linear-gradient(135deg,${dark},${c})`};color:var(--on)}.hero .lead{color:inherit;opacity:.92}.hero .btn{background:#fff;border-color:#fff;color:${dark}}.hero .btn.alt{background:transparent;color:inherit;border-color:currentColor}h1{font-weight:800}`,
    elegant: `body{background:#fbf8f3}h1,h2,.brand{font-family:'Playfair Display',Georgia,serif}.hero{background:${img ? `linear-gradient(rgba(22,18,17,.78),rgba(22,18,17,.78)),url("${d.heroImage}") center/cover` : '#161211'};color:#fff}.hero .lead{color:#d9d0ca}.hero .btn.alt{color:#fff;border-color:#fff}section.s.alt{background:#f3eee6}.card{box-shadow:none;border-radius:6px}.btn,button,input,textarea{border-radius:4px}`,
  }[tpl];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(d.name)}${d.tagline ? ' | ' + e(d.tagline) : ''}</title><meta name="description" content="${e(d.tagline || d.about.slice(0, 150))}">
<meta property="og:title" content="${e(d.name)}"><meta property="og:description" content="${e(d.tagline)}">${d.heroImage ? `<meta property="og:image" content="${e(d.heroImage)}">` : ''}
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">${ld}</script>
<style>:root{--c:${c};--d:${dark};--t:${tint};--on:${on};--ink:#1b1715;--mut:#6b625d;--ln:#e9e2de}*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:76px}
body{margin:0;font:17px/1.65 Inter,system-ui,sans-serif;color:var(--ink);background:#fff}a{color:inherit}img{max-width:100%}.w{max-width:1080px;margin:auto;padding:0 22px}
nav.top{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.93);backdrop-filter:blur(10px);border-bottom:1px solid var(--ln);color:var(--ink)}
nav.top .w{display:flex;align-items:center;justify-content:space-between;height:70px;gap:16px}.brand{font-weight:800;font-size:1.2rem;letter-spacing:-.01em;text-decoration:none;display:flex;align-items:center;gap:10px}.brand img{height:42px;width:auto}
.links{display:flex;gap:24px;font-weight:600;font-size:.95rem}.links a{text-decoration:none;opacity:.78}.links a:hover{opacity:1;color:var(--c)}
.btn{display:inline-block;padding:13px 26px;border-radius:999px;background:var(--c);color:var(--on);font-weight:700;text-decoration:none;margin:6px 10px 0 0;border:2px solid var(--c)}.btn.alt{background:transparent;color:var(--c)}
.hero{padding:100px 0 88px;background:var(--t)}h1{font-size:clamp(2.2rem,6vw,3.8rem);line-height:1.06;letter-spacing:-.03em;margin:0 0 16px;max-width:760px}.lead{font-size:1.2rem;color:var(--mut);max-width:620px;margin:0 0 24px}
section.s{padding:76px 0}section.s.alt{background:#faf7f5}h2{font-size:clamp(1.6rem,4vw,2.3rem);letter-spacing:-.02em;margin:0 0 8px}.sub{color:var(--mut);margin:0 0 30px}
.eyebrow{font-weight:700;color:var(--c);text-transform:uppercase;letter-spacing:.12em;font-size:.78rem;margin-bottom:8px}.two{display:grid;grid-template-columns:1.4fr 1fr;gap:44px;align-items:start}
.card{background:#fff;border:1px solid var(--ln);border-radius:16px;padding:26px;box-shadow:0 8px 24px rgba(27,23,21,.05);color:var(--ink)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px}
.num{width:44px;height:44px;border-radius:12px;background:var(--t);color:var(--c);display:grid;place-items:center;font-weight:800;margin-bottom:14px}.card h3{margin:0 0 6px;font-size:1.12rem}.card p{margin:0;color:var(--mut);font-size:.97rem}
.q{font-size:1.05rem;color:var(--ink)!important}.q b{display:block;margin-top:12px;color:var(--c)}.facts p{margin:0 0 12px;color:var(--ink)}.facts b{display:block;font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:var(--c)}
form{display:grid;gap:12px}input,textarea{font:inherit;padding:13px 14px;border:1.5px solid var(--ln);border-radius:12px;width:100%}button{font:inherit;cursor:pointer;border:0;border-radius:999px;padding:14px;background:var(--c);color:var(--on);font-weight:700}
footer{background:#161211;color:#cfc6c1;padding:42px 0;font-size:.92rem}footer .w{display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px}footer a{margin-right:18px;text-decoration:none;color:#fff}footer .cr a{margin:0;text-decoration:underline}
.wa{position:fixed;right:18px;bottom:18px;width:58px;height:58px;border-radius:50%;background:#25d366;display:grid;place-items:center;box-shadow:0 8px 22px rgba(0,0,0,.3);z-index:30}
@media(max-width:760px){.links{display:none}.two{grid-template-columns:1fr}.hero{padding:64px 0}section.s{padding:56px 0}}${TPL}</style></head><body>
<nav class="top"><div class="w"><a class="brand" href="#top">${d.logo ? `<img src="${e(d.logo)}" alt="${e(d.name)}">` : e(d.name)}</a><div class="links">${links}</div>${wa ? `<a class="btn" style="margin:0" href="https://wa.me/${e(wa)}">WhatsApp</a>` : d.phone ? `<a class="btn" style="margin:0" href="tel:${e(d.phone)}">Call us</a>` : ''}</div></nav>
<header class="hero" id="top"><div class="w"><div><h1>${e(d.name)}</h1>${d.tagline ? `<p class="lead">${e(d.tagline)}</p>` : ''}${wa ? `<a class="btn" href="https://wa.me/${e(wa)}">Chat on WhatsApp</a>` : ''}${d.phone ? `<a class="btn alt" href="tel:${e(d.phone)}">Call ${e(d.phone)}</a>` : ''}</div>${tpl === 'modern' && img ? `<img class="himg" src="${e(d.heroImage)}" alt="">` : ''}</div></header>
${d.about || hasFacts ? `<section class="s" id="about"><div class="w two"><div>${d.about ? `<div class="eyebrow">About us</div><h2>Who we are</h2><p>${e(d.about).replace(/\n/g, '<br>')}</p>` : ''}</div>${hasFacts ? `<div class="card facts">${d.address ? `<p><b>Find us</b><a href="${e(maps)}" target="_blank" rel="noopener">${e(d.address)}</a></p>` : ''}${d.hours.length ? `<p><b>Opening hours</b>${d.hours.map(h => e(h)).join('<br>')}</p>` : ''}${d.phone ? `<p><b>Phone</b><a href="tel:${e(d.phone)}">${e(d.phone)}</a></p>` : ''}${d.email ? `<p><b>Email</b><a href="mailto:${e(d.email)}">${e(d.email)}</a></p>` : ''}</div>` : ''}</div></section>` : ''}
${d.services.length ? `<section class="s alt" id="services"><div class="w"><div class="eyebrow">What we do</div><h2>Our services</h2><p class="sub">Everything you need, done properly.</p><div class="grid">${d.services.map((s, i) => `<div class="card"><div class="num">${String(i + 1).padStart(2, '0')}</div><h3>${e(s.t)}</h3>${s.d ? `<p>${e(s.d)}</p>` : ''}</div>`).join('')}</div></div></section>` : ''}
${d.reviews.length ? `<section class="s" id="reviews"><div class="w"><div class="eyebrow">Reviews</div><h2>What our customers say</h2><p class="sub"></p><div class="grid">${d.reviews.map(r => `<div class="card"><p class="q">&ldquo;${e(r.q)}&rdquo;${r.n ? `<b>${e(r.n)}</b>` : ''}</p></div>`).join('')}</div></div></section>` : ''}
<section class="s alt" id="contact"><div class="w two"><div><div class="eyebrow">Contact</div><h2>Let&rsquo;s talk</h2><p class="sub">${wa ? 'Send us a message and it opens straight in WhatsApp.' : 'Send us a message by email.'}</p>${d.phone ? `<a class="btn" href="tel:${e(d.phone)}">Call ${e(d.phone)}</a>` : ''}${d.email ? `<a class="btn alt" href="mailto:${e(d.email)}">Email us</a>` : ''}</div>
${wa || d.email ? `<form class="card" id="cf"><input name="n" placeholder="Your name" required><textarea name="m" rows="4" placeholder="How can we help?" required></textarea><button>Send message</button></form>` : ''}</div></section>
<footer><div class="w"><div><b style="color:#fff">${e(d.name)}</b><br>&copy; ${new Date().getFullYear()} All rights reserved.</div><div>${social}</div><div class="cr">Website by <a href="${e(origin || '#')}">Epitome Designs</a></div></div></footer>
${wa ? `<a class="wa" href="https://wa.me/${e(wa)}" aria-label="Chat on WhatsApp"><svg viewBox="0 0 32 32" width="30" height="30" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 27l1.8-6.2A11.5 11.5 0 1 1 11.4 25.3z"/><path d="M12 11c-.6 1.7.8 4.6 3 6.6s4.6 3.2 6 2.6l1-1.5-2.6-1.5-1.2 1.1c-1-.4-2.700-1.900-3.500-3.300l1-1.200L14.800 9.500z"/></svg></a>` : ''}
<script>var f=document.getElementById('cf');if(f)f.onsubmit=function(v){v.preventDefault();location.href=${formTarget}+encodeURIComponent('Hello, I am '+f.n.value+'. '+f.m.value)}</script></body></html>`;
}
