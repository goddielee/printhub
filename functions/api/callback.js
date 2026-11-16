// Safaricom calls this after the customer pays or cancels.
export async function onRequestPost({ request, env }) {
  const cb = (await request.json().catch(() => ({}))).Body?.stkCallback;
  if (cb?.CheckoutRequestID) {
    if (cb.ResultCode === 0) {
      const receipt = cb.CallbackMetadata?.Item?.find(i => i.Name === 'MpesaReceiptNumber')?.Value || '';
      await env.DB.prepare("UPDATE quotes SET status='deposit_paid', receipt=? WHERE checkout_id=?").bind(receipt, cb.CheckoutRequestID).run();
    } else {
      await env.DB.prepare("UPDATE quotes SET status='payment_failed' WHERE checkout_id=?").bind(cb.CheckoutRequestID).run();
    }
  }
  return Response.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
