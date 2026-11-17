// Turns a client's site details into a finished web page. Everything typed by clients is escaped.
const e = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function clean(d = {}) {
  const t = (v, n) => String(v ?? '').trim().slice(0, n);
  return {
    template: d.template === 'bold' ? 'bold' : 'clean',
    name: t(d.name, 60) || 'Your Business',
    tagline: t(d.tagline, 120),
    about: t(d.about, 800),
    services: (Array.isArray(d.services) ? d.services : String(d.services ?? '').split('\n')).map(x => String(x).trim().slice(0, 80)).filter(Boolean).slice(0, 8),
    phone: t(d.phone, 20).replace(/[^\d+]/g, ''),
    email: t(d.email, 80),
    address: t(d.address, 120),
    color: /^#[0-9a-f]{6}$/i.test(d.color) ? d.color : '#841813',
  };
}

export function renderSite(raw) {
  const d = clean(raw), bold = d.template === 'bold';
  const wa = d.phone.replace(/\D/g, '').replace(/^0/, '254');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(d.name)}</title><meta name="description" content="${e(d.tagline)}">
<style>:root{--c:${d.color}}*{box-sizing:border-box}body{margin:0;font:17px/1.6 system-ui,sans-serif;color:#1e1412;background:#fff}
header{background:${bold ? 'var(--c)' : '#fff'};color:${bold ? '#fff' : '#1e1412'};padding:${bold ? '80px 20px' : '56px 20px 28px'};text-align:${bold ? 'center' : 'left'}}
.w{max-width:860px;margin:auto}h1{margin:0;font-size:clamp(2rem,6vw,3.2rem);line-height:1.1;${bold ? '' : 'color:var(--c)'}}.tag{font-size:1.2rem;margin:.6em 0 0;opacity:.85}
section{padding:34px 20px}h2{color:var(--c);margin:0 0 12px}ul{padding:0;list-style:none;display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
li{padding:14px 16px;border-left:5px solid var(--c);background:#f6f1ef;border-radius:6px}
.btn{display:inline-block;margin:6px 8px 0 0;padding:12px 20px;border-radius:8px;background:var(--c);color:#fff;text-decoration:none;font-weight:700}
footer{padding:22px;text-align:center;color:#6f5f5a;font-size:.85rem;border-top:1px solid #eadfdb}</style></head><body>
<header><div class="w"><h1>${e(d.name)}</h1>${d.tagline ? `<p class="tag">${e(d.tagline)}</p>` : ''}</div></header>
${d.about ? `<section><div class="w"><h2>About us</h2><p>${e(d.about).replace(/\n/g, '<br>')}</p></div></section>` : ''}
${d.services.length ? `<section><div class="w"><h2>What we do</h2><ul>${d.services.map(s => `<li>${e(s)}</li>`).join('')}</ul></div></section>` : ''}
<section><div class="w"><h2>Get in touch</h2>${d.phone ? `<a class="btn" href="tel:${e(d.phone)}">Call ${e(d.phone)}</a><a class="btn" href="https://wa.me/${e(wa)}">WhatsApp</a>` : ''}${d.email ? `<a class="btn" href="mailto:${e(d.email)}">Email us</a>` : ''}${d.address ? `<p>${e(d.address)}</p>` : ''}</div></section>
<footer>&copy; ${new Date().getFullYear()} ${e(d.name)}</footer></body></html>`;
}
