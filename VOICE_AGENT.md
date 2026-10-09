# Wiring the website to your LiveKit agent

**Website → agent.** The "Talk to us" button, the collection cards and the "Inquire by voice" button call `/api/token`, join a fresh room `interwood-xxxx`, and send JSON on data topic `iw`:

```
{"type":"intro","lang":"en|ar"}                 // right after the call connects
{"type":"category","id":"sofa|curtains|carpet|decor","lang":"en|ar"}
{"type":"inquiry","lang":"en|ar"}
```
Participant attribute `lang` is also set. Scripts live in `agent/scripts.json`.

**Dispatch.** If your agent registers with an `agent_name`, set `LIVEKIT_AGENT_NAME` in env (token then dispatches it). Otherwise it auto-joins every room.

**First click = participant attribute (no race).** The first thing a visitor clicks is sent in the token as participant attribute `intent` (JSON, e.g. `{"type":"category","id":"carpet"}`) plus `lang`. Your agent must read it right after the visitor joins and speak that script *instead of its own default greeting*. Later clicks in the same call arrive as data messages on topic `iw`.

**Agent side (reference, livekit-agents 1.x, Python — adjust to your build):**
```python
import json, asyncio
from livekit import rtc
SCRIPTS = json.load(open("scripts.json"))

def script_for(m, lang):
    if m["type"] == "category": return SCRIPTS["category"][m["id"]][lang]
    if m["type"] == "inquiry":  return SCRIPTS["inquiry"][lang]
    return SCRIPTS["intro"][lang]

# entrypoint:
await ctx.connect()
participant = await ctx.wait_for_participant()
attrs = participant.attributes
lang = attrs.get("lang", "en")
intent = json.loads(attrs.get("intent", '{"type":"intro"}'))
await session.start(agent=Agent(instructions=PROMPT), room=ctx.room)   # NO generate_reply() greeting here
await session.say(script_for(intent, lang), allow_interruptions=True)

@ctx.room.on("data_received")          # clicks made after the call started
def on_data(pkt: rtc.DataPacket):
    if pkt.topic != "iw": return
    m = json.loads(pkt.data)
    session.interrupt()
    asyncio.create_task(session.say(script_for(m, m.get("lang", "en")), allow_interruptions=True))
```
**Important:** remove any default `session.generate_reply("greet the user")` / hard-coded "Welcome to Interwood" greeting, otherwise it speaks over the script.

After a script, the LLM continues using `VOICE_AGENT_PROMPT.md`; add the spoken text to chat context so it stays coherent. For `inquiry`, the prompt's lead-capture flow takes over after the name question.

Carpets: Interwood sells fine Kashmiri and Iranian carpets among other styles (add to the prompt; do not invent prices/specs).
