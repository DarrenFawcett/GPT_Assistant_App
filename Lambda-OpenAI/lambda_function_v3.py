import os
import json
import time
from datetime import datetime
from zoneinfo import ZoneInfo
import uuid

import openai

# === Config ===
DEFAULT_TZ = "Europe/London"
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")

# === Init OpenAI ===
# Uses the new SDK pattern like you had
client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])

print(f"🔍 Lambda cold start at: {time.time()}")

# === Helpers ===
def _resp(body_obj: dict, status: int = 200):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST",
        },
        "body": json.dumps(body_obj),
    }

def _parse_body(event) -> dict:
    """Parse API Gateway body safely. Returns {} on failure."""
    if not isinstance(event, dict):
        return {}
    raw = event.get("body")
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str) and raw.strip():
        try:
            return json.loads(raw)
        except Exception:
            # Accept plain text bodies too (fallback)
            return {"messages": [{"role": "user", "content": raw}]}
    return {}

def _normalize_messages(payload: dict) -> list[dict]:
    """
    Expect payload like { messages: [{role, content}, ...] }
    If a single 'text' is provided, wrap it into a user message.
    Always returns a well-formed list for OpenAI.
    """
    msgs = payload.get("messages")
    if isinstance(msgs, list) and all(isinstance(m, dict) for m in msgs):
        return msgs

    text = payload.get("text") or payload.get("message") or ""
    if isinstance(text, str) and text.strip():
        return [{"role": "user", "content": text.strip()}]

    # Last resort: empty chat
    return [{"role": "user", "content": "Hello"}]

# === Lambda handler (CHAT ONLY) ===
def lambda_handler(event, context):
    print("🔵 Event received:", event)
    print("🔵 Raw Event:", json.dumps(event, indent=2, default=str))

    # Handle preflight or quick warmups gracefully
    if event.get("httpMethod") == "OPTIONS":
        return _resp({"ok": True})

    body = _parse_body(event)

    # lightweight healthcheck/warmup knob (optional)
    if body.get("ping") in ("health", "warmup"):
        return _resp({"ok": True, "ts": time.time()})

    now_ldn = datetime.now(ZoneInfo(DEFAULT_TZ))
    today_str = now_ldn.strftime("%Y-%m-%d (%A)")

    # System prompt stays tiny; you can expand later
    system_prompt = (
        f"Today is {today_str} in {DEFAULT_TZ}.\n"
        "You are kAI, Darren Fawcett’s assistant. "
        "Reply in natural, helpful text."
    )

    user_messages = _normalize_messages(body)
    messages = [{"role": "system", "content": system_prompt}] + user_messages

    # 👉 Intent nudge check (before GPT call)
    latest = user_messages[-1]["content"].lower() if user_messages else ""

    # ✅ Add this block here
    if "testing" in latest:
        return _resp({
            "reply": (
                "✅ kAI confirmed chat testing.\n"
                "Lambda ARN: arn:aws:lambda:eu-west-2:123456789012:function:chat-lambda"
            )
        })

    if "calendar" in latest or "schedule" in latest or "add event" in latest:
        return _resp({
            "reply": "📅 Looks like you want to add to the calendar. "
                     "Hit the Calendar tab at the top and send again."
        })
    if "todo" in latest:
        return _resp({
            "reply": "📝 Looks like this belongs in your To-Do list. "
                     "Switch to the To-Do tab and resend."
        })
    if "note" in latest:
        return _resp({
            "reply": "🗒️ Looks like you want to save a note. "
                     "Switch to the Notes tab and resend."
        })

    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            temperature=0.5,
        )
        reply = response.choices[0].message.content or ""
        print("🧠 GPT RAW REPLY:", repr(reply))
        return _resp({"reply": reply})

    except Exception as e:
        err_id = str(uuid.uuid4())
        print(f"❌ Error ID {err_id}: {repr(e)}")
        return _resp({
            "reply": f"⚠️ Chat error (ID {err_id}): something went wrong.",
            "error_id": err_id,
            "calendar_list": [],
            "calendar_event": None,
            "calendar_invoke_status": {"error": str(e)}
        }, status=500)
