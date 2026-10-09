// OpenRouter proxy: Vercel serverless function (also mounted by server.js locally).
// Keeps the API key off the browser.
const SYSTEM = `You are the virtual assistant of INTERWOOD ("إنترود"), a Riyadh, Saudi Arabia company for furniture & curtains: stylish/custom curtains, custom sofas (living-room and majlis seating), and interior decor solutions, with designs tailored to each client.
Facts you may state: phone +966 50 325 1018; WhatsApp/phone 0540 091 268 (wa.me/966540091268); Instagram @interwood.ksa; hours Sun–Thu 9:00 AM–10:00 PM, Friday closed (Saturday not listed; suggest confirming); Managing Director Farhan Ashraf Qadri, Assistant Manager Hassan Shafqat Sheikh; Riyadh location via Google Maps.
Rules: reply in the language the user writes in (Arabic or English; Gulf-friendly, polished Arabic). Be warm, concise (max ~80 words). Never invent prices, discounts, delivery times, or materials; for quotes, measurements, or bookings, invite them to WhatsApp 0540 091 268 and offer to note their need. Stay on topic (furniture, curtains, decor); politely decline unrelated requests.`;


export default async function chat(req, res) {
  const send = (code, obj) => res.status(code).json(obj);
  if (req.method !== 'POST') return send(405, { error: 'POST only' });
  const KEY = process.env.OPENROUTER_API_KEY, MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
  if (!KEY) return send(500, { error: 'OPENROUTER_API_KEY not set' });
  const msgs0 = req.body?.messages;
  let msgs = msgs0;
  if (!Array.isArray(msgs)) return send(400, { error: 'bad messages' });
  // trust boundary: only user/assistant roles, capped history/length
  msgs = msgs.slice(-12).filter(m => ['user', 'assistant'].includes(m.role)).map(m => ({ role: m.role, content: String(m.content).slice(0, 1000) }));
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${KEY}`, 'content-type': 'application/json', 'x-title': 'Interwood' },
      body: JSON.stringify({ model: MODEL, max_tokens: 400, messages: [{ role: 'system', content: SYSTEM }, ...msgs] }),
    });
    const j = await r.json();
    const reply = j.choices?.[0]?.message?.content;
    if (!reply) return send(502, { error: j.error?.message || 'no reply' });
    send(200, { reply });
  } catch (e) { send(502, { error: String(e) }); }
}

