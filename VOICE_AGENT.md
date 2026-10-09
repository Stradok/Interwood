# Wiring the website to your LiveKit agent

**Website → agent.** The "Talk to us" button, the collection cards and the "Inquire by voice" button call `/api/token`, join a fresh room `interwood-xxxx`, and send JSON on data topic `iw`:

```
{"type":"intro","lang":"en|ar"}                 // right after the call connects
{"type":"category","id":"sofa|curtains|carpet|decor","lang":"en|ar"}
{"type":"inquiry","lang":"en|ar"}
```
Participant attribute `lang` is also set. Scripts live in `agent/scripts.json`.

**Dispatch.** If your agent registers with an `agent_name`, set `LIVEKIT_AGENT_NAME` in env (token then dispatches it). Otherwise it auto-joins every room.

**Agent side (reference, livekit-agents 1.x, Python — adjust to your build):**
```python
import json, asyncio
from livekit import rtc
SCRIPTS = json.load(open("scripts.json"))

# after `await session.start(...)`:
@ctx.room.on("data_received")
def on_data(pkt: rtc.DataPacket):
    if pkt.topic != "iw":
        return
    m = json.loads(pkt.data); lang = m.get("lang", "en")
    if m["type"] == "intro":
        text = SCRIPTS["intro"][lang]
    elif m["type"] == "category":
        text = SCRIPTS["category"][m["id"]][lang]
    elif m["type"] == "inquiry":
        text = SCRIPTS["inquiry"][lang]
    else:
        return
    session.interrupt()
    asyncio.create_task(session.say(text, allow_interruptions=True))
```
After a script, the LLM continues the conversation using `VOICE_AGENT_PROMPT.md` (add the script text to chat context so it stays coherent: `session.history`/`chat_ctx.add_message(role="assistant", content=text)`). For `inquiry`, the prompt's lead-capture flow takes over after the name question.

Add carpets to the prompt's "What Interwood offers": *Carpets — finishing layer; team advises on options and sizes.* (No prices/specs invented.)
