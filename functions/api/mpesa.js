// Sends an M-Pesa STK Push for the 50% deposit. Secrets are set in Cloudflare, never in code.
export async function onRequestPost({ request, env }) {
  const { id, phone } = await request.json().catch(() => ({}));
  const q = await env.DB.prepare('SELECT * FROM quotes WHERE id=?').bind(id).first();
  const msisdn = String(phone || '').replace(/\D/g, '').replace(/^0/, '254').replace(/^7|^1/, '254$&');
  if (!q || !/^254[17]\d{8}$/.test(msisdn)) return Response.json({ error: 'Enter a valid Safaricom number, e.g. 0712345678.' }, { status: 400 });
  const base = env.MPESA_ENV === 'live' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
  const auth = await (await fetch(`${base}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: 'Basic ' + btoa(`${env.MPESA_KEY}:${env.MPESA_SECRET}`) } })).json();
  const ts = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const res = await (await fetch(`${base}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + auth.access_token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: env.MPESA_SHORTCODE,
      Password: btoa(env.MPESA_SHORTCODE + env.MPESA_PASSKEY + ts), Timestamp: ts,
      TransactionType: 'CustomerPayBillOnline', // use CustomerBuyGoodsOnline for a Till
      Amount: q.finish === 'domain' ? q.total : Math.ceil(q.total / 2), PartyA: msisdn, PartyB: env.MPESA_SHORTCODE, PhoneNumber: msisdn,
      CallBackURL: new URL('/api/callback', request.url).href,
      AccountReference: 'QUOTE' + q.id, TransactionDesc: 'Print deposit' }) })).json();
  if (res.ResponseCode !== '0') return Response.json({ error: res.errorMessage || 'M-Pesa request failed.' }, { status: 502 });
  await env.DB.prepare('UPDATE quotes SET checkout_id=?, phone=? WHERE id=?').bind(res.CheckoutRequestID, msisdn, q.id).run();
  return Response.json({ ok: true, message: 'Check your phone and enter your M-Pesa PIN.' });
}
