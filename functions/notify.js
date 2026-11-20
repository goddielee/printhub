// Optional owner alerts on Telegram. Does nothing until TG_TOKEN and TG_CHAT are set in Cloudflare (as Secrets).
export async function alert(env, text) {
  if (!env.TG_TOKEN || !env.TG_CHAT) return;
  try {
    await fetch(`https://api.telegram.org/bot${env.TG_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TG_CHAT, text: String(text).slice(0, 900) }),
    });
  } catch { /* an alert failing must never block an order */ }
}
