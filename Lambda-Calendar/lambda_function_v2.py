import os
import json
import time
import re
from datetime import datetime, timedelta
from calendar import month_name
from zoneinfo import ZoneInfo

import openai
import boto3

# === Config ===
DEFAULT_TZ = "Europe/London"
ISO_DATE = "%Y-%m-%d"
HM_TIME = "%H:%M"
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
CAL_LAMBDA_NAME = os.environ.get("GOOGLE_CALENDAR_LAMBDA", "google_calendar_function")
MONTHS = {m.lower(): i for i, m in enumerate(month_name) if m}
YEAR_RE = re.compile(r"\b(20\d{2})\b")
WEEKDAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]

# === Init OpenAI ===
client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])
print(f"🔍 Lambda cold start at: {time.time()}")

# === format_event_list ===
def format_event_list(events, tz=DEFAULT_TZ):
    if not events:
        return "❌ No events found."
    lines = []
    for e in events:
        summary = e.get("summary", "(no title)")
        start_iso = (e.get("start", {}) or {}).get("dateTime") or e.get("start", {}).get("date")
        end_iso   = (e.get("end", {}) or {}).get("dateTime") or e.get("end", {}).get("date")
        if start_iso and len(start_iso) == 10: start_iso += "T09:00:00"
        if end_iso and len(end_iso) == 10: end_iso += "T09:30:00"
        try:
            start = datetime.fromisoformat(start_iso).astimezone(ZoneInfo(tz))
            st = start.strftime("%a %d %b, %I:%M%p").replace(":00", "")
        except Exception:
            st = start_iso or "?"
        lines.append(f"• **{summary}** — {st}")
    return "\n".join(lines)



# Rewritten OpenAI Lambda: Combined Calendar Logic
# Everything in one unified `handle_calendar` function with `parse_calendar_query` integrated

def handle_calendar(user_messages, today_str):
    from zoneinfo import ZoneInfo
    now_ldn = datetime.now(ZoneInfo(DEFAULT_TZ))
    today_date = now_ldn.strftime("%Y-%m-%d")
    latest_user = user_messages[-1].get("content", "").strip().lower()

    # === Unified Query Parser ===
    query = None
    q = latest_user
    for mname, midx in MONTHS.items():
        if f"in {mname}" in q or mname in q:
            ym = YEAR_RE.search(q)
            year = int(ym.group(1)) if ym else now_ldn.year
            query = {"action": "get_month", "year": year, "month": midx}
            break
    if not query:
        if "this year" in q or "events this year" in q:
            query = {"action": "get_year", "year": now_ldn.year}
        else:
            y = YEAR_RE.search(q)
            if y:
                query = {"action": "get_year", "year": int(y.group(1))}
            elif "all events" in q or "everything" in q or "all my events" in q:
                query = {"action": "get_all_upcoming", "horizon_days": 365}
            else:
                m = re.search(r"\\bnext\\s+([a-z' ]+?)\\b", q)
                if m:
                    query = {"action": "find_next", "term": m.group(1).strip()}
                else:
                    fm = re.search(r"\\bfind\\s+([a-z' ]+)", q)
                    if fm:
                        query = {"action": "find", "term": fm.group(1).strip()}

    # === Handle Queries ===
    if query:
        if query["action"] in ("find_next", "find"):
            try:
                expand_prompt = f"""
                The user asked: \"{latest_user}\"
                Expand this into a short JSON list of likely event keywords for a Google Calendar search.
                Keep them simple, lowercase, and single words or short phrases.
                Example:
                {{"terms": ["dentist","teeth","orthodontist","appointment"]}}
                """
                gpt_resp = client.chat.completions.create(
                    model=OPENAI_MODEL,
                    messages=[{"role": "system", "content": expand_prompt}],
                    temperature=0.2,
                    response_format={"type": "json_object"}
                )
                extra = json.loads(gpt_resp.choices[0].message.content or "{}")
                if "terms" in extra:
                    query["terms"] = extra["terms"]
            except Exception as e:
                print("⚠️ GPT expansion failed:", e)

        try:
            resp = boto3.client("lambda").invoke(
                FunctionName=CAL_LAMBDA_NAME,
                InvocationType="RequestResponse",
                Payload=json.dumps(query).encode("utf-8"),
            )
            raw_body = resp["Payload"].read().decode("utf-8")
            body_field = json.loads(raw_body).get("body", "[]")
            events = json.loads(body_field) if isinstance(body_field, str) else body_field

            label = {
                "get_all_upcoming": "all events",
                "get_month": f"events for {month_name[query.get('month', 0)]} {query.get('year')}",
                "get_year": f"events for {query.get('year')}",
                "find_next": f"next {query.get('term','event')}",
                "find": f"events matching “{query.get('term','')}”",
            }.get(query["action"], "events")

            if query["action"] == "find_next":
                if isinstance(events, list) and events:
                    e = events[0]
                    summary = e.get("summary", "(no title)")
                    start_iso = (e.get("start", {}) or {}).get("dateTime") or e.get("start", {}).get("date")
                    if start_iso and len(start_iso) == 10:
                        start_iso += "T09:00:00"
                    try:
                        start = datetime.fromisoformat(start_iso).astimezone(ZoneInfo(DEFAULT_TZ))
                        st = start.strftime("%a %d %b, %I:%M%p").replace(":00", "")
                    except Exception:
                        st = start_iso or "?"
                    return _resp({"reply": f"📅 Next {query.get('term','event')}: **{summary}** — {st}", "calendar_list": [e], "calendar_event": None})
                else:
                    return _resp({"reply": f"❌ No upcoming {query.get('term','event')} found.", "calendar_list": [], "calendar_event": None})

            return _resp({"reply": f"📅 Here are your {label}:\n" + format_event_list(events), "calendar_list": events, "calendar_event": None})

        except Exception as e:
            return _resp({"reply": f"⚠️ Couldn’t fetch events: {e}", "calendar_event": None, "calendar_list": []})

    # === Handle Adds ===
    system_prompt = (
        f"You are a helpful calendar assistant. Today is {today_date} in Europe/London timezone.\n\n"
        "Your job is to extract all valid calendar events from the user's message.\n\n"
        "You must return a JSON object with action and events. Only include valid events."
    )
    messages = [{"role": "system", "content": system_prompt}] + user_messages
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,
        temperature=0.3,
        response_format={"type": "json_object"}
    )

    reply = response.choices[0].message.content or ""
    print("🧠 GPT RAW REPLY:", repr(reply))

    try:
        event_data = json.loads(reply)
        events = event_data.get("events", [])
        if not isinstance(events, list) or not events:
            return _resp({"reply": "⚠️ No events parsed.", "calendar_event": None})

        added = []
        for evt in events:
            ok, reason = validate_event_json(evt)
            if not ok:
                continue
            google_event = convert_to_google_format(evt)
            resp = boto3.client("lambda").invoke(
                FunctionName=CAL_LAMBDA_NAME,
                InvocationType="RequestResponse",
                Payload=json.dumps({"action": "add", "event": google_event}).encode("utf-8"),
            )
            raw_body = resp["Payload"].read().decode("utf-8")
            g_body = json.loads(raw_body).get("body", "{}")
            g_event = json.loads(g_body) if isinstance(g_body, str) else g_body
            summary = g_event.get("summary", evt["summary"])
            added.append(summary)

        if added:
            return _resp({"reply": f"✅ Added {len(added)} events: " + ", ".join(added), "calendar_event": events, "calendar_invoke_status": {"statusCode": resp.get("StatusCode")}})
        else:
            return _resp({"reply": "⚠️ No valid events could be added.", "calendar_event": None})

    except Exception as e:
        return _resp({"reply": f"⚠️ Couldn’t parse/add events: {e}", "calendar_event": None})


    # 2) --- Handle Add ---
    system_prompt = (
         f"You are a helpful calendar assistant. Today is {today_date} in Europe/London timezone.\n\n"
        "Your job is to extract all valid calendar events from the user's message.\n\n"

        "You must return a JSON object. The structure is:\n"
        "{\n"
        '  "action": "add" | "get" | "get_month" | "get_year",\n'
        '  "events": [\n'
        "    {\n"
        '      "summary": string,\n'
        '      "start": ISO 8601 datetime string (with timezone if possible),\n'
        '      "end": ISO 8601 datetime string,\n'
        '      "location": string,\n'
        '      "notes": string,\n'
        '      "color": string (default: "11")\n'
        "    },\n"
        "    ... (one object per event)\n"
        "  ]\n"
        "}\n\n"

        "If the user’s message is asking to *view* events (e.g., “what's on this month?”), "
        "set the `action` field accordingly:\n"
        "- `get`: retrieve upcoming events\n"
        "- `get_month`: retrieve events from today to the end of this month\n"
        "- `get_year`: retrieve events from today to the end of this year\n\n"

        "If the user is adding events, use `action: add`.\n"
        "Always fill missing fields with smart defaults (e.g., 30 minutes duration, empty notes, default color).\n"
        "Only include events with valid dates/times.\n"
    )

    messages = [{"role": "system", "content": system_prompt}] + user_messages

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,
        temperature=0.3,
        response_format={"type": "json_object"}
    )

    reply = response.choices[0].message.content or ""
    print("🧠 GPT RAW REPLY:", repr(reply))

        try:
            event_data = json.loads(reply)
            events = event_data.get("events", [])

            if not isinstance(events, list) or not events:
                return _resp({"reply": "⚠️ No events parsed.", "calendar_event": None})

            added = []
            for evt in events:
                ok, reason = validate_event_json(evt)
                if not ok:
                    continue

                google_event = convert_to_google_format(evt)

                resp = boto3.client("lambda").invoke(
                    FunctionName=CAL_LAMBDA_NAME,
                    InvocationType="RequestResponse",
                    Payload=json.dumps({"action": "add", "event": google_event}).encode("utf-8"),
                )

                raw_body = resp["Payload"].read().decode("utf-8")
                g_body = json.loads(raw_body).get("body", "{}")
                g_event = json.loads(g_body) if isinstance(g_body, str) else g_body

                summary = g_event.get("summary", evt["summary"])
                added.append(summary)

            if added:
                return _resp({
                    "reply": f"✅ Added {len(added)} events: " + ", ".join(added),
                    "calendar_event": events,
                    "calendar_invoke_status": {"statusCode": resp.get("StatusCode")},
                })
            else:
                return _resp({"reply": "⚠️ No valid events could be added.", "calendar_event": None})

        except Exception as e:
            return _resp({
                "reply": f"⚠️ Couldn’t parse/add events: {e}",
                "calendar_event": None
            })

# ===========================
# ===   Router function   ===

ROUTER_DAY_HINTS = [
    (r"\bthis\s+week\b", 7),
    (r"\bnext\s+week\b", 14),   # simple approx
    (r"\bthis\s+month\b", 31),
    (r"\bnext\s+month\b", 62),  # simple approx
]

def fast_route_from_messages(event: dict) -> dict:
    """Cheap intent router to avoid a GPT call for common queries."""
    msgs = event.get("messages") or []
    if not msgs:
        return event

    # Concatenate user messages (keep it simple)
    text = " ".join(m.get("content","") for m in msgs if m.get("role") == "user").lower().strip()
    if not text:
        return event

    # 1) "what's on / show ... next N days"
    m = re.search(r"\b(?:what'?s\s+on|show)\b.*?\bnext\s+(\d+)\s*day", text)
    if m:
        event["action"] = "get"
        event["days"] = int(m.group(1))
        event["days_back"] = 0
        return event

    # 2) plain "next N days?"
    m = re.search(r"\bnext\s+(\d+)\s*days?\b", text)
    if m:
        event["action"] = "get"
        event["days"] = int(m.group(1))
        event["days_back"] = 0
        return event

    # 3) quick “this/next week/month”
    for pattern, days in ROUTER_DAY_HINTS:
        if re.search(pattern, text):
            event["action"] = "get"
            event["days"] = days
            event["days_back"] = 0
            return event

    # 4) "next <thing>"  (next dentist, next eye test, etc.)
    m = re.search(r"\bnext\s+([a-z][a-z\s]{0,40})\b", text)
    if m and not re.search(r"\bday|week|month|year\b", m.group(1)):
        term = m.group(1).strip()
        event["action"] = "find_next"
        event["terms"] = [term]
        event["days"] = 365  # look ahead up to a year
        event["days_back"] = 0
        return event

    # 5) "find all events in the next N days"
    m = re.search(r"\bfind\b.*\bnext\s+(\d+)\s*days?\b", text)
    if m:
        event["action"] = "get"
        event["days"] = int(m.group(1))
        event["days_back"] = 0
        return event

    print("⚡ Router match:", event.get("action"), "| Terms:", event.get("terms", None), "| Days:", event.get("days", None))
    return event




# === Helpers ===
def convert_to_google_format(event):
    date = event.get("date")
    time_str = event.get("time")
    duration = event.get("duration_minutes", 30)
    start_dt = datetime.fromisoformat(f"{date}T{time_str}")
    end_dt = start_dt + timedelta(minutes=duration)

    return {
        "summary": event["summary"],
        "start": {"dateTime": start_dt.isoformat(), "timeZone": DEFAULT_TZ},
        "end":   {"dateTime": end_dt.isoformat(),   "timeZone": DEFAULT_TZ},
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "popup", "minutes": 2 * 24 * 60}  # 2 days before
            ]
        }
    }

def validate_event_json(evt: dict) -> tuple[bool, str]:
    required = ["summary", "date", "time"]
    missing = [k for k in required if k not in evt]
    if missing:
        return False, f"Missing fields: {', '.join(missing)}"
    try:
        datetime.strptime(evt["date"], ISO_DATE)
    except Exception:
        return False, "Bad date format (use YYYY-MM-DD)."
    try:
        datetime.strptime(evt["time"], HM_TIME)
    except Exception:
        return False, "Bad time format (use HH:MM in 24h)."
    dur = evt.get("duration_minutes", 30)
    if not isinstance(dur, int) or dur <= 0 or dur > 24 * 60:
        return False, "duration_minutes must be a positive integer (minutes)."
    return True, ""

GET_PATTERNS = (
    "what's on", "whats on", "show my calendar", "do i have anything",
    "any events", "what do i have", "what's my day", "whats my day",
    "what's on friday", "whats on friday", "show events", "list events"
)
def wants_calendar_get(text: str) -> bool:
    q = (text or "").lower()
    return any(p in q for p in GET_PATTERNS)

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

# === Lambda handler ===
def lambda_handler(event, context):
    print("🔵 Event received:", event)

    now_ldn = datetime.now(ZoneInfo(DEFAULT_TZ))
    today_str = now_ldn.strftime("%Y-%m-%d (%A)")

    event = parse_apigw_body(event)
    event = fast_route_from_messages(event)

    if not event.get("action"):
        try:
            event = extract_calendar_from_messages(event)
        except ValueError as e:
            return _resp({"error": str(e)}, status=400)

    # --- Parse body ---
    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        body = {}
    tab = body.get("tab", "Chat")  # Default = Chat
    user_messages = body.get("messages", [])

    # --- Route based on tab ---
    if tab == "Calendar":
        return handle_calendar(user_messages, today_str)
    elif tab == "Todo":
        return handle_todo(user_messages, today_str)   # (to be built later)
    elif tab == "Notes":
        return handle_notes(user_messages, today_str)  # (to be built later)
    elif tab == "Email":
        return handle_email(user_messages, today_str)  # (to be built later)
    messages = [{"role": "system", "content": system_prompt}] + user_messages

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,
        temperature=0.5,
    )

    reply = response.choices[0].message.content or ""
    print("🧠 GPT RAW REPLY:", repr(reply))

    return _resp({"reply": reply, "calendar_event": None})
