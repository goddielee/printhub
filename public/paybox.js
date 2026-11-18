// Shows Paybill payment steps and collects the M-Pesa confirmation code.
async function payBox(el, id, amount) {
  const E = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let p;
  try {
    const r = await fetch('/api/pay'); p = await r.json();
    if (!r.ok) { el.innerHTML = `<p class="msg">${E(p.error)}</p>`; return; }
  } catch { el.innerHTML = '<p class="msg">Could not load payment details. Please try again.</p>'; return; }
  el.innerHTML = `<p class="note">Order number: <b>${Number(id)}</b></p><p><b>Pay KES ${Number(amount).toLocaleString('en-KE')} by M-Pesa</b></p>
<ol style="padding-left:20px;margin:6px 0"><li>Open M-Pesa, choose Lipa na M-Pesa, then Pay Bill.</li><li>Business number: <b>${E(p.paybill)}</b></li><li>Account number: <b>${E(p.account)}</b></li><li>Amount: <b>${Number(amount)}</b>, then enter your PIN.</li></ol>
<label for="pc${id}">M-Pesa confirmation code</label><input id="pc${id}" maxlength="10" placeholder="e.g. SKL2A3B4C5" autocapitalize="characters" autocomplete="off">
<button type="button">I have paid</button><p class="msg" aria-live="polite"></p>`;
  const msg = el.querySelector('.msg'), inp = el.querySelector('input'), btn = el.querySelector('button');
  btn.onclick = async () => {
    const r = await fetch('/api/pay', { method: 'POST', body: JSON.stringify({ id, code: inp.value }) });
    const d = await r.json();
    msg.innerHTML = r.ok ? `Thank you! We will confirm your payment shortly. Your order number is <b>${Number(id)}</b>. Track it any time on <a href="/track.html">our tracking page</a>.` : E(d.error);
    if (r.ok) { btn.disabled = true; inp.disabled = true; }
  };
}
