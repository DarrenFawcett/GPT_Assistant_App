import json
import os
import tempfile
import datetime as dt
import time
import re
from datetime import datetime, timedelta, timezone
from calendar import month_name
from zoneinfo import ZoneInfo
from difflib import SequenceMatcher

import boto3
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import openai


# =============================================================================
# === CONFIG & CONSTANTS ======================================================
# =============================================================================

ISO_DATE = "%Y-%m-%d"
HM_TIME = "%H:%M"
OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
CAL_LAMBDA_NAME = os.environ.get("GOOGLE_CALENDAR_LAMBDA", "google_calendar_function")
DEFAULT_TZ   = os.environ.get("DEFAULT_TZ", "Europe/London")
CALENDAR_ID  = os.environ.get("CALENDAR_ID", "primary")

S3_BUCKET    = os.environ.get("S3_BUCKET_NAME", "gpt-assistant-static-web-app")
S3_TOKEN_KEY = os.environ.get("S3_TOKEN_KEY", "token/token_lambda.json")

SCOPES = ["https://www.googleapis.com/auth/calendar"]
MONTHS = {m.lower(): i for i, m in enumerate(month_name) if m}
YEAR_RE = re.compile(r"\b(20\d{2})\b")
WEEKDAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]
WORD = re.compile(r"[a-z0-9]+")

client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])
s3 = boto3.client("s3")

print(f"🔍 Lambda cold start at: {time.time()}")

# =============================================================================
# === GPT SYSTEM PROMPT =======================================================
# =============================================================================

today_date = dt.datetime.now(dt.timezone.utc).astimezone(ZoneInfo(DEFAULT_TZ)).strftime("%A %d %B %Y")
system_prompt = (
    f"You are a helpful calendar assistant. Today is {today_date} in Europe/London timezone.\n\n"
    "Your job is to extract all valid calendar events from the user's message.\n\n"
    "Return a JSON object with:\n"
    "{\n"
    '  "action": "add" | "find" | "find_next" | "find_year" | "get" | "sum_annual_leave",\n'
    '  "events": [\n'
    '    {"summary": string, "start": ISO8601 string or "YYYY-MM-DD", "end": ISO8601 string or "YYYY-MM-DD", '
    '"location": string, "notes": string, "color": string}\n'
    "  ],\n"
    '  "terms": [string],\n'
    '  "days": number,         // optional: forward window for get/find\n'
    '  "days_back": number     // optional: look-back window\n'
    "}\n\n"
    "Rules:\n"
    "- If the user wants to add events, use action `add` and build `events` (one object per event).\n"
    "- If the request is a general time window without search terms (e.g., \"what's on this month\", "
    "\"show everything next week\"), use action `get` and set `days` and/or `days_back`.\n"
    "- If the request is a search with keywords (e.g., \"next dentist appointment\"), use `find` / "
    "`find_next` / `find_year` and populate `terms`.\n"
    "- If an end time is omitted, leave `end` empty; the system will default to 30 minutes after `start`.\n"
    "- If no time is provided, create an all-day event: set `start` to YYYY-MM-DD and leave `end` empty "
    "(the system will set it to the next day).\n"
    "- Only include events with valid dates/times. Do not guess.\n"
    "- If the user asks to total/count/“add up” holidays or annual leave, set action `sum_annual_leave` "
    "and include an optional `year` (YYYY). If no year is stated, omit it."
)

# =============================================================================
# === RESPONSE HELPERS ========================================================
# =============================================================================

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

# =============================================================================
# === AUTH / CALENDAR SERVICE ================================================
# =============================================================================

def load_token_from_s3():
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        s3.download_fileobj(S3_BUCKET, S3_TOKEN_KEY, tmp)
        tmp.flush()
        creds = Credentials.from_authorized_user_file(tmp.name, SCOPES)
    return creds

def init_calendar_service():
    creds = load_token_from_s3()
    return build("calendar", "v3", credentials=creds)

# =============================================================================
# === TEXT HELPERS ============================================================
# =============================================================================

def norm_text(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").lower()).strip()

def tokens(s: str) -> list[str]:
    return WORD.findall(norm_text(s))

def stem(w: str) -> str:
    # ultra-light stemmer for plurals
    return w[:-1] if w.endswith("s") else w

def loose_match_text(term: str, text: str, threshold: float = 0.64) -> bool:
    term = norm_text(term)
    text = norm_text(text)

    if not term or not text:
        return False
    if term in text:
        return True
    t_stems = {stem(w) for w in tokens(term)}
    x_stems = {stem(w) for w in tokens(text)}
    if t_stems and t_stems.issubset(x_stems):
        return True
    if ("doctor" in t_stems and ("dr" in x_stems or "doctor" in x_stems)) or \
       ("dentist" in t_stems and "dentist" in x_stems):
        return True
    ratio = SequenceMatcher(None, term, text).ratio()
    return ratio >= threshold

def as_int(x, default: int) -> int:
    try:
        return int(x)
    except (TypeError, ValueError):
        return default

def scrub_nones(obj):
    if isinstance(obj, dict):
        return {k: scrub_nones(v) for k, v in obj.items() if v is not None}
    if isinstance(obj, list):
        return [scrub_nones(v) for v in obj if v is not None]
    return obj

# =============================================================================
# === DATE/TIME HELPERS =======================================================
# =============================================================================

def fill_end_if_missing(event: dict) -> dict:
    start = event.get("start", {})
    end   = event.get("end", {})

    # treat "missing or incomplete" as missing
    has_end_dt   = isinstance(end, dict) and bool(end.get("dateTime"))
    has_end_date = isinstance(end, dict) and bool(end.get("date"))

    if not (has_end_dt or has_end_date):
        # Timed start → +30 minutes
        if "dateTime" in start and start.get("dateTime"):
            try:
                start_dt = dt.datetime.fromisoformat(start["dateTime"].replace("Z", "+00:00"))
                end_dt = start_dt + dt.timedelta(minutes=30)
                event["end"] = {
                    "dateTime": to_rfc3339(end_dt),
                    "timeZone": start.get("timeZone", DEFAULT_TZ),
                }
            except Exception as e:
                print("⚠️ Failed to auto-fill end:", e)

        # All-day start → +1 day (Google expects exclusive end)
        elif "date" in start and start.get("date"):
            try:
                d = dt.date.fromisoformat(start["date"])
                event["end"] = {"date": (d + dt.timedelta(days=1)).isoformat()}
            except Exception as e:
                print("⚠️ Failed to set all-day end:", e)

    return event


def to_rfc3339(dt_obj: dt.datetime) -> str:
    if dt_obj.tzinfo is None:
        dt_obj = dt_obj.replace(tzinfo=dt.timezone.utc)
    return dt_obj.astimezone(dt.timezone.utc).isoformat().replace("+00:00", "Z")

def month_bounds(year: int, month: int) -> tuple[str, str]:
    first = dt.datetime(year, month, 1, 0, 0, 0, tzinfo=dt.timezone.utc)
    if month == 12:
        next_first = dt.datetime(year + 1, 1, 1, 0, 0, 0, tzinfo=dt.timezone.utc)
    else:
        next_first = dt.datetime(year, month + 1, 1, 0, 0, 0, tzinfo=dt.timezone.utc)
    return to_rfc3339(first), to_rfc3339(next_first)

def year_bounds(year: int) -> tuple[str, str]:
    start = dt.datetime(year, 1, 1, 0, 0, 0, tzinfo=dt.timezone.utc)
    end   = dt.datetime(year + 1, 1, 1, 0, 0, 0, tzinfo=dt.timezone.utc)
    return to_rfc3339(start), to_rfc3339(end)

def ensure_timezone(event: dict) -> dict:
    for key in ("start", "end"):
        if key in event and isinstance(event[key], dict):
            if "dateTime" in event[key] and "timeZone" not in event[key]:
                event[key]["timeZone"] = DEFAULT_TZ
    return event

def get_event_start(e):
    """Return the start datetime or date string (RFC3339). Supports all-day and timed events."""
    start = e.get("start", {})
    return start.get("dateTime") or start.get("date") or "9999-01-01T00:00:00Z"
def ordinal(n: int) -> str:
    if 10 <= n % 100 <= 20:
        suf = "th"
    else:
        suf = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suf}"

def _plural_days(val: float) -> str:
    # 1 → "1 day"; 1.5 → "1.5 days"; 2.0 → "2 days"
    is_int = float(val).is_integer()
    n = int(val) if is_int else float(val)
    unit = "day" if n == 1 else "days"
    return f"{n:g} {unit}"

def _compress_day_list(day_ints: list[int]) -> str:
    if not day_ints:
        return ""
    day_ints = sorted(set(day_ints))
    ranges = []
    start = prev = day_ints[0]
    for d in day_ints[1:]:
        if d == prev + 1:
            prev = d
            continue
        ranges.append((start, prev))
        start = prev = d
    ranges.append((start, prev))
    parts = []
    for a, b in ranges:
        if a == b:
            parts.append(ordinal(a))
        else:
            parts.append(f"{ordinal(a)}–{ordinal(b)}")
    return ", ".join(parts)

def read_window_params(event: dict, fwd_default: int = 30, back_default: int = 0):
    days_forward = as_int(event.get("days"), fwd_default)
    days_back    = as_int(event.get("days_back"), back_default)
    return days_forward, days_back

# =============================================================================
# === EVENT NORMALIZATION =====================================================
# =============================================================================

def auto_fill_event(event: dict) -> dict:
    event = apply_color(event)
    event = ensure_timezone(event)
    event = fill_end_if_missing(event)
    return event


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

def validate_event(event: dict) -> bool:
    if not isinstance(event, dict):
        return False
    summary = event.get("summary")
    start = event.get("start", {})
    end = event.get("end", {})
    if not summary or not isinstance(start, dict) or not isinstance(end, dict):
        return False
    if not ("dateTime" in start or "date" in start):
        return False
    if not ("dateTime" in end or "date" in end):
        return False
    return True

def slim(e):
    return {
      "id": e.get("id"),
      "title": e.get("summary"),
      "start": e.get("start"),
      "end": e.get("end"),
      "link": e.get("htmlLink"),
      "colorId": e.get("colorId"),
    }

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

# =============================================================================
# === COLOR HANDLING ==========================================================
# =============================================================================

COLOR_KEYWORDS = {
    "annual leave": "2", "annual-leave": "2", "holiday": "2", "vacation": "2", "leave": "2",
    "work": "5", "shift": "5", "on call": "5", "on-call": "5",
    "cover": "5", "overtime": "5", "work related": "5", "work-related": "5",
}

DEFAULT_COLOR = "5"

def apply_color(event: dict) -> dict:
    summary = (event.get("summary") or "").lower()
    for kw, color_id in COLOR_KEYWORDS.items():
        if kw in summary:
            event["colorId"] = color_id
            break
    else:
        event.setdefault("colorId", DEFAULT_COLOR)
    return event

# =============================================================================
# === EVENT FETCHING ==========================================================
# =============================================================================

def _fetch_events_window(days_back: int, days_forward: int, max_results: int = 3000):
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days_back)
    end   = now + timedelta(days=days_forward)
    service = init_calendar_service()
    items = []
    page_token = None
    while True:
        resp = service.events().list(
            calendarId=CALENDAR_ID,
            timeMin=start.isoformat(),
            timeMax=end.isoformat(),
            singleEvents=True,
            orderBy="startTime",
            pageToken=page_token,
            maxResults=min(max_results, 250),
        ).execute()
        batch = resp.get("items", [])
        items.extend(batch)
        page_token = resp.get("nextPageToken")
        if not page_token or len(items) >= max_results:
            break
    return items

def _fetch_events_between(iso_min: str, iso_max: str, max_results: int = 3000):
    service = init_calendar_service()
    items, page_token = [], None
    while True:
        resp = service.events().list(
            calendarId=CALENDAR_ID,
            timeMin=iso_min,
            timeMax=iso_max,
            singleEvents=True,
            orderBy="startTime",
            pageToken=page_token,
            maxResults=min(max_results, 250),
        ).execute()
        items.extend(resp.get("items", []))
        page_token = resp.get("nextPageToken")
        if not page_token or len(items) >= max_results:
            break
    seen, out = set(), []
    for e in items:
        eid = e.get("id")
        if eid not in seen:
            seen.add(eid); out.append(e)
    out.sort(key=get_event_start)
    return out

def _fetch_events_between_all_cals(iso_min: str, iso_max: str, max_results: int = 3000):
    service = init_calendar_service()
    cals, page = [], None
    while True:
        resp = service.calendarList().list(pageToken=page, minAccessRole="reader").execute()
        cals.extend(resp.get("items", []))
        page = resp.get("nextPageToken")
        if not page: break

# =============================================================================
# === FINDING EVENTS ==========================================================
# =============================================================================

def find_matching_events(terms: list[str], days_back: int = 7, days_forward: int = 365):
    events = _fetch_events_window(days_back, days_forward)
    matches = []
    for e in events:
        combined = " ".join([
            e.get("summary", "") or "",
            e.get("description", "") or "",
            e.get("location", "") or "",
        ])
        if any(loose_match_text(t, combined) for t in terms):
            matches.append({
                "summary": e.get("summary", "") or "",
                "link": e.get("htmlLink"),
                "start": e.get("start"),
                "id": e.get("id"),
            })
    return matches

def find_all(term_or_terms, horizon_years: int = 3):
    if isinstance(term_or_terms, str):
        terms = [term_or_terms]
    else:
        terms = term_or_terms or []
    days_forward = 365 * horizon_years
    results = find_matching_events(terms, days_back=7, days_forward=days_forward)
    return results

def find_next(search_terms, horizon_years=3):
    all_events = find_all(search_terms, horizon_years=horizon_years)
    return [all_events[0]] if all_events else []

# =============================================================================
# === ANNUAL LEAVE HELPERS ====================================================
# =============================================================================

LEAVE_TERMS = ("annual leave", "holiday", "holidays", "vacation", "leave")
_HALF_PAT = re.compile(r"\bhalf(?:-|\s*)day\b|½|\b0\.5\b", re.IGNORECASE)

def _is_annual_leave_event(e: dict) -> bool:
    text = f"{(e.get('summary') or '').lower()} {(e.get('description') or '').lower()}"
    return any(term in text for term in LEAVE_TERMS)

def _leave_units_for_event(e: dict, tz: str = DEFAULT_TZ) -> float:
    text = f"{(e.get('summary') or '')} {(e.get('description') or '')}".lower()
    if _HALF_PAT.search(text):
        return 0.5
    start = e.get("start", {}) or {}
    end   = e.get("end", {}) or {}
    if start.get("date") and end.get("date"):
        try:
            sd = dt.date.fromisoformat(start["date"])
            ed = dt.date.fromisoformat(end["date"])
            days = max(0, (ed - sd).days)
            return float(days) if days else 1.0
        except Exception:
            return 1.0
    return 1.0

# =============================================================================
# === ADD EVENTS ==============================================================
# =============================================================================

def _blank_timed_event():
    return {
        "summary": "(no title)",
        "description": "",
        "location": "",
        "colorId": DEFAULT_COLOR,
        "start": {"dateTime": None, "timeZone": DEFAULT_TZ},
    }

def _blank_allday_event():
    return {
        "summary": "(no title)",
        "description": "",
        "location": "",
        "colorId": DEFAULT_COLOR,
        "start": {"date": None},
    }

def _iso_is_datetime(s: str) -> bool:
    return isinstance(s, str) and "T" in s

def _set_start_end_from_strings(evt: dict, start_str: str | None, end_str: str | None):
    if start_str:
        if _iso_is_datetime(start_str):
            evt["start"] = {"dateTime": start_str, "timeZone": DEFAULT_TZ}
        else:
            evt["start"] = {"date": start_str}
    if end_str:
        if _iso_is_datetime(end_str):
            evt["end"] = {"dateTime": end_str, "timeZone": DEFAULT_TZ}
        else:
            evt["end"] = {"date": end_str}

def prepare_add_events_from_gpt(gpt_events: list[dict]) -> list[dict]:
    prepped: list[dict] = []
    for raw in (gpt_events or []):
        start_s = raw.get("start")
        end_s   = raw.get("end")
        base = _blank_timed_event() if _iso_is_datetime(start_s or "") or _iso_is_datetime(end_s or "") else _blank_allday_event()
        if raw.get("summary"):   base["summary"]     = raw["summary"]
        if raw.get("location"):  base["location"]    = raw["location"]
        if raw.get("notes"):     base["description"] = raw["notes"]
        if raw.get("color"):
            base["colorId"] = str(raw["color"])
        _set_start_end_from_strings(base, start_s, end_s)
        full = auto_fill_event(base)
        if validate_event(full):
            prepped.append(full)
    return prepped

def _is_google_event_like(e: dict) -> bool:
    s = e.get("start")
    en = e.get("end")
    return isinstance(s, dict) or isinstance(en, dict)

def add_events(events_data: dict | list[dict]) -> list[dict]:
    service = init_calendar_service()
    if isinstance(events_data, dict):
        events_data = [events_data]
    valid: list[dict] = []
    for raw in events_data:
        e = auto_fill_event(dict(raw))
        st, en = e.get("start", {}), e.get("end", {})
        if e.get("summary") and isinstance(st, dict) and isinstance(en, dict) and \
           (("dateTime" in st) or ("date" in st)) and (("dateTime" in en) or ("date" in en)):
            valid.append(e)
    created: list[dict] = []
    for body in valid:
        created.append(service.events().insert(calendarId=CALENDAR_ID, body=body).execute())
    return created

# =============================================================================
# === GPT EXTRACTION / NORMALIZATION =========================================
# =============================================================================

def parse_apigw_body(event: dict) -> dict:
    if not isinstance(event, dict):
        return {}
    if "body" in event:
        try:
            body = event["body"]
            payload = json.loads(body) if isinstance(body, str) else (body or {})
            if isinstance(payload, dict):
                event.update(payload)
        except Exception as e:
            print("⚠️ Body parse failed:", e)
    return event
    
def _normalize_parsed(parsed: dict) -> dict:
    if not isinstance(parsed, dict):
        return {}
    if "event" in parsed and "events" not in parsed:
        evt = parsed.pop("event")
        parsed["events"] = [evt] if isinstance(evt, dict) else (evt or [])
    if "events" in parsed and isinstance(parsed["events"], dict):
        parsed["events"] = [parsed["events"]]
    return parsed

def extract_calendar_from_messages(event: dict) -> dict:
    """Send user messages to GPT and return normalized calendar JSON."""
    messages = event.get("messages", [])
    if not messages:
        return event

    user_text = messages[-1].get("content", "")
    if not user_text:
        return event

    # Call GPT
    resp = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_text},
        ],
        temperature=0,
        max_tokens=500,
    )

    raw = resp.choices[0].message.content.strip()

    try:
        parsed = json.loads(raw)
    except Exception as e:
        print("⚠️ GPT parse failed:", raw, e)
        raise ValueError("GPT did not return valid JSON")

    return _normalize_parsed(parsed)


# =============================================================================
# === MAIN HANDLER ============================================================
# =============================================================================

def lambda_handler(event, context=None):
    print("🚀 Running calendar lambda v2.1 with all-day fix")
    print("📥 Event received:", event)

    # 1) normalize API GW body
    event = parse_apigw_body(event)

    # ✅ Testing confirmation (before GPT / calendar logic)
    latest = ""
    if isinstance(event.get("messages"), list) and event["messages"]:
        latest = event["messages"][-1].get("content", "").lower()
    elif isinstance(event.get("content"), str):
        latest = event["content"].lower()

    if "testing" in latest:
        return _resp({
            "reply": (
                "✅ kAI confirmed calendar testing.\n"
                "Lambda ARN: arn:aws:lambda:eu-west-2:123456789012:function:calendar-lambda"
            )
        })

    # 2) run GPT extraction if chat-style request
    try:
        event = extract_calendar_from_messages(event)
    except ValueError as e:
        return _resp({"error": str(e)}, status=400)

    action = event.get("action")

    try:
        if action == "find":
            search_terms = event.get("terms", [])
            horizon_days, days_back = read_window_params(event, fwd_default=31, back_default=7)
            return_one   = bool(event.get("return_one", False))

            if not any(str(t).strip() for t in search_terms):
                events = _fetch_events_window(days_back, horizon_days)
                return _resp({"events": [slim(e) for e in events]})

            events = find_matching_events(search_terms, days_back=days_back, days_forward=horizon_days)
            return _resp({"event": events[0]} if return_one else {"events": events})

        elif action == "find_next":
            search_terms = event.get("terms", []) or [event.get("term", "")]
            days_forward, days_back = read_window_params(event, fwd_default=30, back_default=0)

            if not any(str(t).strip() for t in search_terms):
                events = _fetch_events_window(days_back, days_forward)
                next_event = events[0] if events else None
                return _resp({"event": slim(next_event)} if next_event else {"event": None})

            events = find_matching_events(search_terms, days_back=days_back, days_forward=days_forward)
            return _resp({"event": events[0] if events else None})

        elif action == "find_year":
            search_terms = event.get("terms", []) or [event.get("term", "")]
            days_forward, days_back = read_window_params(event, fwd_default=365, back_default=7)

            if not any(str(t).strip() for t in search_terms):
                events = _fetch_events_window(days_back, days_forward)
                return _resp({"events": [slim(e) for e in events]})
            else:
                events = find_matching_events(search_terms, days_back=days_back, days_forward=days_forward)
                return _resp({"events": events})

        elif action == "add":
            # Accept either "event" (single), "events" (list), or GPT-minimal events.
            raw_events = []
            if event.get("event"):
                raw_events = [event["event"]]
            elif isinstance(event.get("events"), list):
                raw_events = event["events"]

            if not raw_events:
                return _resp({"error": "No events provided for add."}, status=400)

            # If caller sent full Google bodies (start/end dicts), keep them; else build them.
            if any(_is_google_event_like(e) for e in raw_events):
                to_create = [auto_fill_event(dict(e)) for e in raw_events]
            else:
                to_create = prepare_add_events_from_gpt(raw_events)

            if not to_create:
                return _resp({"error": "No valid events to add after normalization."}, status=400)

            created = add_events(to_create)

            if len(created) == 1:
                return _resp(created[0])
            return _resp({"events": created})

        elif action == "get":
            days_forward, days_back = read_window_params(event, fwd_default=31, back_default=0)
            events = _fetch_events_window(days_back, days_forward)
            return _resp({"events": [slim(e) for e in events]})

        elif action == "sum_annual_leave":
            tz_now = datetime.now(ZoneInfo(DEFAULT_TZ))
            year = int(event.get("year", tz_now.year))

            iso_min, iso_max = year_bounds(year)
            events = _fetch_events_between_all_cals(iso_min, iso_max)
            leave_events = [e for e in events if _is_annual_leave_event(e)]

            total = 0.0
            monthly_detail = {}

            for e in leave_events:
                units = _leave_units_for_event(e)
                total += units
                s = e.get("start", {})
                ds = s.get("date") or s.get("dateTime", "")
                d = None
                try:
                    if "T" in ds:
                        d = datetime.fromisoformat(ds.replace("Z", "+00:00")).astimezone(
                            ZoneInfo(DEFAULT_TZ)
                        ).date()
                    elif ds:
                        d = dt.date.fromisoformat(ds)
                except Exception:
                    pass

                if d:
                    mk = d.strftime("%Y-%m")
                    monthly_detail.setdefault(mk, {"days": 0.0, "dates": []})
                    monthly_detail[mk]["days"] += units
                    monthly_detail[mk]["dates"].append(d.strftime("%d %b"))

            # sort dates per month
            for mk in monthly_detail:
                monthly_detail[mk]["dates"].sort()

            # 👉 Build reply string
            if total == 0:
                reply_text = f"❌ No annual leave found for {year}."
            else:
                header = f"📅 You’ve booked {_plural_days(total)} annual leave in {year}:"
                lines = [header]

                # pretty print months in chronological order
                for mk in sorted(monthly_detail.keys()):
                    month_dt = datetime.strptime(mk, "%Y-%m")
                    month_name_str = month_dt.strftime("%B")
                    days_val = monthly_detail[mk]["days"]

                    # extract day numbers from strings like "08 Dec"
                    day_ints = []
                    for d in monthly_detail[mk]["dates"]:
                        try:
                            day_ints.append(int(d.split()[0]))
                        except Exception:
                            pass

                    dates_str = _compress_day_list(day_ints) if day_ints else ""
                    lines.append(
                        f"• {month_name_str} — {_plural_days(days_val)}"
                        + (f" ({dates_str})" if dates_str else "")
                    )

                reply_text = "\n".join(lines)

            return _resp({
                "year": year,
                "total_days": total,
                "by_month": monthly_detail,
                "reply": reply_text,
            })


        else:
            return _resp({"error": "Invalid action"}, status=400)

    except Exception as e:
        print("❌ Error:", repr(e))
        return _resp({"error": str(e)}, status=500)
