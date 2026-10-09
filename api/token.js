// Mints a short-lived LiveKit room token (HS256 JWT signed with node:crypto, no SDK needed).
import { createHmac, randomBytes } from 'node:crypto';

const b64 = o => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');

export default async function token(req, res) {
  const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_AGENT_NAME } = process.env;
  if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) return res.status(500).json({ error: 'LiveKit env not set' });
  const lang = req.body?.lang === 'ar' ? 'ar' : 'en';
  const id = randomBytes(6).toString('hex');
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: LIVEKIT_API_KEY, sub: `visitor-${id}`, nbf: now, exp: now + 900,
    name: 'Website visitor', attributes: { lang },
    video: { room: `interwood-${id}`, roomJoin: true, canPublish: true, canSubscribe: true, canPublishData: true },
    // only needed if your agent registers with an explicit agent_name (otherwise it auto-joins every room)
    ...(LIVEKIT_AGENT_NAME && { roomConfig: { agents: [{ agentName: LIVEKIT_AGENT_NAME }] } }),
  };
  const body = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(claims)}`;
  const sig = createHmac('sha256', LIVEKIT_API_SECRET).update(body).digest('base64url');
  res.status(200).json({ url: LIVEKIT_URL, token: `${body}.${sig}` });
}
