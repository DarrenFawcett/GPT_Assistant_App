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
AUTO_ADD = os.environ.get("AUTO_ADD_TO_CALENDAR", "false").lower() == "true"
MONTHS = {m.lower(): i for i, m in enumerate(month_name) if m}
YEAR_RE = re.compile(r"\b(20\d{2})\b")
WEEKDAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]

# === Init OpenAI ===
client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])
print(f"🔍 Lambda cold start at: {time.time()}")

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
                {"method": "popup", "minutes": 2 * 24 * 60}  # ⏰ 2 days before
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

def find_calendar_block(text: str) -> dict | None:
    if not text:
        return None
    cleaned = text.replace("“", '"').replace("”", '"').replace("\u00a0", " ")
    m = re.search(r"CALENDAR_EVENT:\s*```(?:json)?\s*({.*?})\s*```", cleaned, re.DOTALL | re.IGNORECASE)
    if not m:
        m = re.search(r"CALENDAR_EVENT:\s*({.*?})", cleaned, re.DOTALL | re.IGNORECASE)
    if not m:
        return None
    block = re.sub(r",(\s*[}\]])", r"\1", m.group(1).strip())
    try:
        return json.loads(block)
    except Exception:
        return None

def strip_calendar_block_from_reply(text: str) -> str:
    if not text:
        return ""
    return text.split("CALENDAR_EVENT:", 1)[0].strip()

def _parse_iso(s: str) -> datetime:
    # tolerate ...Z and naive strings
    if not s:
        return None
    if s.endswith("Z"):
        s = s.replace("Z", "+00:00")
    return datetime.fromisoformat(s)

def _to_local(dt_iso: str, tz=DEFAULT_TZ) -> datetime:
    dt_utc = _parse_iso(dt_iso)
    return dt_utc.astimezone(ZoneInfo(tz)) if dt_utc.tzinfo else dt_utc.replace(tzinfo=ZoneInfo(tz))

def _fmt_time(dt: datetime) -> str:
    # e.g. "Fri 11 Oct, 12:00pm"
    return dt.strftime("%a %d %b, %-I:%M%p").lower().replace(":00pm", "pm").replace(":00am", "am")

def _fmt_range(start_iso: str, end_iso: str, tz=DEFAULT_TZ) -> tuple[str, str, str]:
    start = _to_local(start_iso, tz)
    end   = _to_local(end_iso, tz)
    start_txt = _fmt_time(start)
    end_txt   = _fmt_time(end)
    mins = int((end - start).total_seconds() // 60)
    dur_txt = f"{mins} min" if mins < 60 else (f"{mins//60} hr" if mins % 60 == 0 else f"{mins//60} hr {mins%60} min")
    return start_txt, end_txt, dur_txt

# ---------- Calendar intent parsing ----------
def parse_calendar_query(text: str, now_ldn: datetime):
    q = (text or "").lower().strip()
    if not q:
        return None

    # 1) NEXT <term>
    m = re.search(r"\bnext\s+([a-z' ]+?)\b(?:\?|$)", q)
    if m:
        return {"action": "find_next", "term": m.group(1).strip()}
    if "when am i at" in q and "next" in q:
        term = q.split("when am i at", 1)[1].split("next", 1)[0].strip(" ?.")
        return {"action": "find_next", "term": term}

    # 2) Month view
    for mname, midx in MONTHS.items():
        if f"in {mname}" in q or q.startswith(mname) or f"{mname} " in q:
            ym = YEAR_RE.search(q)
            year = int(ym.group(1)) if ym else now_ldn.year
            return {"action": "get_month", "year": year, "month": midx}

    # 3) Year view
    if "this year" in q:
        return {"action": "get_year", "year": now_ldn.year}
    y = YEAR_RE.search(q)
    if y:
        return {"action": "get_year", "year": int(y.group(1))}

    # 4) Find <term> [this month/year / <month> [year] / just upcoming]
    fm = re.search(r"\bfind\s+([a-z' ]+)", q)
    if fm:
        term = fm.group(1).strip()
        if "this month" in q:
            return {"action": "get_month", "year": now_ldn.year, "month": now_ldn.month, "term": term}
        if "this year" in q:
            return {"action": "get_year", "year": now_ldn.year, "term": term}
        for mname, midx in MONTHS.items():
            if mname in q:
                ym = YEAR_RE.search(q)
                year = int(ym.group(1)) if ym else now_ldn.year
                return {"action": "get_month", "year": year, "month": midx, "term": term}
        ym = YEAR_RE.search(q)
        if ym:
            return {"action": "get_year", "year": int(ym.group(1)), "term": term}
        return {"action": "find", "term": term}

    # 5) All events upcoming window
    m = re.search(r"next\s+(\d+)\s*(day|days|week|weeks|month|months)", q)
    if "all events" in q or "show everything" in q or "show all" in q:
        horizon_days = 30
        if m:
            num = int(m.group(1))
            unit = m.group(2)
            if unit.startswith("day"):
                horizon_days = num
            elif unit.startswith("week"):
                horizon_days = num * 7
            elif unit.startswith("month"):
                horizon_days = num * 30
        return {"action": "get_all_upcoming", "horizon_days": horizon_days}

    return None
# --------------------------------------------

def same_or_next_weekday_this_week(base_dt: datetime, target_wd: int) -> datetime:
    days_ahead = target_wd - base_dt.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    return base_dt + timedelta(days=days_ahead)

def resolve_relative_weekday(question: str, now_dt: datetime) -> str | None:
    if not question:
        return None
    q = question.lower()
    wd_hits = [(wd, q.find(wd)) for wd in WEEKDAYS if wd in q]
    if not wd_hits:
        return None
    wd_name = min((h for h in wd_hits if h[1] >= 0), key=lambda x: x[1])[0]
    target_idx = WEEKDAYS.index(wd_name)
    m = re.search(r"\b(this|coming|next)\b", q)
    if m:
        qualifier = m.group(1)
        first = same_or_next_weekday_this_week(now_dt, target_idx)
        target_dt = first if qualifier in ("this", "coming") else first + timedelta(days=7)
    else:
        target_dt = same_or_next_weekday_this_week(now_dt, target_idx)
    return target_dt.strftime("%A %d %B %Y")

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
    path = event.get("requestContext", {}).get("http", {}).get("path", event.get("path", ""))

    if str(path).endswith("/ping"):
        return _resp({"status": "warm"})

    # Parse body
    try:
        body = json.loads(event.get("body") or "{}")
    except Exception:
        body = {}
    user_messages = body.get("messages", [])

    # ✅ (FIX) Define latest_user before using it
    latest_user = ""
    if user_messages and isinstance(user_messages[-1], dict):
        latest_user = (user_messages[-1].get("content") or "").strip()

    # A) Simple GET list (“what’s on…?”)
    if latest_user and wants_calendar_get(latest_user):
        try:
            resp = boto3.client("lambda").invoke(
                FunctionName=CAL_LAMBDA_NAME,
                InvocationType="RequestResponse",
                Payload=json.dumps({"action": "get"}).encode("utf-8"),
            )
            raw_body = resp["Payload"].read().decode("utf-8")
            body_field = json.loads(raw_body).get("body", "[]")
            events = json.loads(body_field) if isinstance(body_field, str) else body_field
            return _resp({
                "reply": "📅 Here are your upcoming events.",
                "calendar_list": events,
                "calendar_event": None,
                "calendar_invoke_status": {"invocationType": "RequestResponse", "action": "get"},
            })
        except Exception as e:
            print("❌ Error invoking calendar GET:", repr(e))
            return _resp({"reply": "⚠️ I couldn't fetch your calendar just now.",
                          "calendar_list": [], "calendar_event": None,
                          "calendar_invoke_status": {"error": str(e)}})

    # B) Relative weekday answer (“this/next Friday?”)
    if latest_user:
        human_date = resolve_relative_weekday(latest_user, now_ldn)
        if human_date:
            return _resp({"reply": human_date, "calendar_event": None, "calendar_invoke_status": None})

    # C) Rich calendar queries (month/year/find/find_next/all-upcoming)
    query = parse_calendar_query(latest_user, now_ldn) if latest_user else None
    if query:
        try:
            action = query.pop("action")
            invoke = {"action": action, **query}
            term = invoke.pop("term", None)

            print("🛰️ Invoking Google Lambda with:", invoke)
            resp = boto3.client("lambda").invoke(
                FunctionName=CAL_LAMBDA_NAME,
                InvocationType="RequestResponse",
                Payload=json.dumps(invoke).encode("utf-8"),
            )
            raw_body = resp["Payload"].read().decode("utf-8")
            body_field = json.loads(raw_body).get("body", "[]")
            data = json.loads(body_field) if isinstance(body_field, str) else body_field

            if term and isinstance(data, list):
                tl = term.lower()
                data = [e for e in data if tl in (e.get("summary","") or "").lower()]

            if action == "find_next":
                if isinstance(data, dict) and data.get("start"):
                    s_iso = data["start"].get("dateTime") or data["start"].get("date")
                    e_iso = data.get("end", {}).get("dateTime") or data.get("end", {}).get("date")
                    if s_iso and len(s_iso) == 10: s_iso += "T09:00:00"
                    if e_iso and len(e_iso) == 10: e_iso += "T09:30:00"
                    st, et, dur = _fmt_range(s_iso, e_iso, tz=DEFAULT_TZ) if (s_iso and e_iso) else (s_iso, e_iso, "")
                    summary = data.get("summary", "(no title)")
                    reply = f"📅 Next {term or 'event'}: **{summary}** — {st}–{et}" + (f" ({dur})" if dur else "")
                else:
                    reply = f"❌ No upcoming {term or 'event'} found."
                return _resp({"reply": reply, "calendar_list": [data] if isinstance(data, dict) and data else []})


            label = {
                "get_month": "events this month",
                "get_year": "events this year",
                "get_all_upcoming": "upcoming events",
                "find": f"events matching “{term or query.get('term','')}”",
                "get": "events",
            }.get(action, "events")

            return _resp({
                "reply": f"📅 Here are your {label}.",
                "calendar_list": data if isinstance(data, list) else [data] if data else [],
                "calendar_event": None,
                "calendar_invoke_status": {"invocationType": "RequestResponse", "action": action},
            })
        except Exception as e:
            print("❌ Error invoking calendar query:", repr(e))
            return _resp({"reply": "⚠️ I couldn't fetch your calendar just now.",
                          "calendar_list": [], "calendar_event": None,
                          "calendar_invoke_status": {"error": str(e)}})

    # D) GPT path (event creation etc.)
    messages = [{
        "role": "system",
        "content": (
            f"Today is {today_str} in Europe/London timezone.\n"
            "You are kAI, a personal assistant built by Darren Fawcett.\n\n"
            "When reasoning about relative dates (e.g., 'this Saturday'), always base it on today's date above.\n"
            "Stay lightweight and friendly. Avoid writing long code or essays unless explicitly asked.\n"
            "Primary jobs:\n"
            "• Help add events to a calendar\n"
            "• Summarize short notes or tasks\n"
            "• Set simple reminders\n"
            "• If the user asks to *look up* calendar info (e.g., 'when is my next dentist'), prefer a terse answer.\n\n"
            "When the user mentions a task with a clear date and time, add EXACTLY ONE block:\n"
            "CALENDAR_EVENT: {\n"
            "  \"summary\": \"Short title\",\n"
            "  \"date\": \"YYYY-MM-DD\",\n"
            "  \"time\": \"HH:MM\",\n"
            "  \"duration_minutes\": 30\n"
            "}\n\n"
            "Do not add extra commentary about the JSON. If details are vague, ask a brief follow-up."
        )
    }] + user_messages

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,
        temperature=0.3,
    )
    reply = response.choices[0].message.content or ""
    print("🧠 GPT Reply:", reply)
    cleaned_reply = strip_calendar_block_from_reply(reply)

    calendar_event = find_calendar_block(reply)
    extracted_event = None
    calendar_invoke_status = None
    calendar_added = None

    if calendar_event:
        calendar_added = None
        ok, reason = validate_event_json(calendar_event)
        if ok:
            extracted_event = calendar_event
            if AUTO_ADD:
                try:
                    google_event = convert_to_google_format(calendar_event)

                    # === Invoke Lambda to add event ===
                    inv_type = os.environ.get("CALENDAR_INVOKE_TYPE", "Event")
                    resp = boto3.client("lambda").invoke(
                        FunctionName=CAL_LAMBDA_NAME,
                        InvocationType=inv_type,
                        Payload=json.dumps({"action": "add", "event": google_event}).encode("utf-8"),
                    )

                    calendar_invoke_status = {"invocationType": inv_type, "statusCode": resp.get("StatusCode")}

                    # === SYNC (requestresponse): parse returned event
                    if inv_type.lower() == "requestresponse":
                        try:
                            rb = resp["Payload"].read().decode("utf-8")
                            g_body  = json.loads(rb).get("body", "{}")
                            g_event = json.loads(g_body) if isinstance(g_body, str) else g_body

                            summary = g_event.get("summary", "(no title)")
                            start_iso = (g_event.get("start", {}) or {}).get("dateTime") or (g_event.get("start", {}) or {}).get("date")
                            end_iso   = (g_event.get("end",   {}) or {}).get("dateTime")   or (g_event.get("end",   {}) or {}).get("date")

                            if start_iso and len(start_iso) == 10: start_iso += "T09:00:00"
                            if end_iso and len(end_iso) == 10: end_iso += "T09:30:00"

                            st, et, dur = _fmt_range(start_iso, end_iso, tz=DEFAULT_TZ)
                            link = g_event.get("htmlLink")

                            cleaned_reply = f"✅ Added **{summary}** — {st}–{et} ({dur})."
                            calendar_added = {
                                "title": summary,
                                "subtitle": f"{st} – {et} · {dur}",
                                "link": link,
                            }
                        except Exception as e:
                            print("⚠️ Couldn’t parse response from Google Lambda:", repr(e))
                            cleaned_reply = "📬 Added (synchronous call), but couldn’t read response."


                    # === ASYNC: fallback reply
                    else:
                        s_iso = google_event["start"]["dateTime"]
                        e_iso = google_event["end"]["dateTime"]
                        st, et, dur = _fmt_range(s_iso, e_iso, tz=DEFAULT_TZ)
                        cleaned_reply = f"📬 Sending **{google_event['summary']}** — {st}–{et} ({dur}) to Google Calendar."

                except Exception as e:
                    print("❌ Error invoking calendar ADD:", repr(e))
                    cleaned_reply = ("❌ I found the event details but couldn't send them to Calendar."
                                     "You can try again in a moment.")
        else:
            cleaned_reply = f"⚠️ I found an event but the format needs a tweak: {reason}"
    else:
        print("⚠️ No CALENDAR_EVENT block found. Returning GPT reply as-is.")

    return _resp({
        "reply": cleaned_reply,
        "calendar_event": extracted_event,
        "calendar_added": calendar_added,  # ✅ UI-ready metadata
        "calendar_invoke_status": calendar_invoke_status,
    })

