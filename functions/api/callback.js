// Safaricom calls this after the customer pays or cancels.
export async function onRequestPost({ request, env }) {
  const cb = (await request.json().catch(() => ({}))).Body?.stkCallback;
  if (cb?.CheckoutRequestID) {
    if (cb.ResultCode === 0) {
      const receipt = cb.CallbackMetadata?.Item?.find(i => i.Name === 'MpesaReceiptNumber')?.Value || '';
      await env.DB.prepare("UPDATE quotes SET status='deposit_paid', receipt=? WHERE checkout_id=?").bind(receipt, cb.CheckoutRequestID).run();
      const q = await env.DB.prepare('SELECT product FROM quotes WHERE checkout_id=?').bind(cb.CheckoutRequestID).first();
      if (q?.product?.startsWith('site:')) await env.DB.prepare("UPDATE sites SET status='published' WHERE slug=?").bind(q.product.slice(5)).run();
    } else {
      const why = `Code ${cb.ResultCode}: ${cb.ResultDesc || ''}`.slice(0, 120);
      await env.DB.prepare("UPDATE quotes SET status='payment_failed', receipt=? WHERE checkout_id=?").bind(why, cb.CheckoutRequestID).run();
    }
  }
  return Response.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
