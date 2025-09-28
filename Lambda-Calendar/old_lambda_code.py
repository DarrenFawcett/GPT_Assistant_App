import json
import os
import tempfile
import datetime as dt
import boto3
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import time
import re
from datetime import datetime, timedelta
from calendar import month_name
from zoneinfo import ZoneInfo
from difflib import SequenceMatcher

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
DEFAULT_COLOR = "2"

# === Init OpenAI ===
client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])
print(f"🔍 Lambda cold start at: {time.time()}")

# === ENV VARS ===
S3_BUCKET    = os.environ.get("S3_BUCKET_NAME", "gpt-assistant-static-web-app")
S3_TOKEN_KEY = os.environ.get("S3_TOKEN_KEY", "token/token_lambda.json")
DEFAULT_TZ   = os.environ.get("DEFAULT_TZ", "Europe/London")
CALENDAR_ID  = os.environ.get("CALENDAR_ID", "primary")

# === CONSTANTS ===
SCOPES = ["https://www.googleapis.com/auth/calendar"]

# === S3 CLIENT ===
s3 = boto3.client("s3")

# === Get today's date in correct timezone for prompt ===
today_date = dt.datetime.now(dt.timezone.utc).astimezone(ZoneInfo(DEFAULT_TZ)).strftime("%A %d %B %Y")


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

COLOR_KEYWORDS = {
    "annual leave": "2", "annual-leave": "2", "holiday": "2", "vacation": "2", "leave": "2",
    "work": "5", "shift": "5", "on call": "5", "on-call": "5",
    "cover": "5", "overtime": "5", "work related": "5", "work-related": "5",
}

# DEFAULT_COLOR = "5"  # yellow
DEFAULT_COLOR = "2"  # yellow

def apply_color(event: dict) -> dict:
    summary = (event.get("summary") or "").lower()

    if "birthday" in summary:
        event["colorId"] = "10"  # 🎂 Red for birthday
    else:
        for kw, color_id in COLOR_KEYWORDS.items():
            if kw in summary:
                event["colorId"] = color_id
                break
        else:
            event.setdefault("colorId", DEFAULT_COLOR)
    return event



def auto_fill_event(event: dict) -> dict:
    event = apply_color(event)
    event = ensure_timezone(event)
    event = fill_end_if_missing(event)
    return event

def normalize_text(text: str) -> str:
    """Lowercase and strip punctuation for looser matching."""
    return re.sub(r"[^a-z0-9 ]", "", (text or "").lower())


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


# === Fill if Missing ===
def fill_end_if_missing(event: dict) -> dict:
    start = event.get("start", {})
    end = event.get("end")

    if not end and "dateTime" in start:
        # Default = 30 mins after start
        try:
            start_dt = dt.datetime.fromisoformat(start["dateTime"].replace("Z", "+00:00"))
            end_dt = start_dt + dt.timedelta(minutes=30)
            event["end"] = {
                "dateTime": to_rfc3339(end_dt),
                "timeZone": start.get("timeZone", DEFAULT_TZ),
            }
        except Exception as e:
            print("⚠️ Failed to auto-fill end:", e)

    elif not end and "date" in start:
        # All-day event → same end date
        event["end"] = {"date": start["date"]}

    return event


# === Token & Service ===
def load_token_from_s3():
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        s3.download_fileobj(S3_BUCKET, S3_TOKEN_KEY, tmp)
        tmp.flush()
        creds = Credentials.from_authorized_user_file(tmp.name, SCOPES)
    return creds

def init_calendar_service():
    creds = load_token_from_s3()
    return build("calendar", "v3", credentials=creds)

def apply_color(summary: str) -> str:
    summary_l = summary.lower()
    for keyword, color in COLOR_KEYWORDS.items():
        if keyword in summary_l:
            return color
    # 🎂 Birthday special case
    if "birthday" in summary_l:
        return "10"
    return "5"  # Default = yellow





def apply_color(event: dict) -> dict:
    summary = (event.get("summary") or "").lower()
    for kw, color_id in COLOR_KEYWORDS.items():
        if kw in summary:
            event["colorId"] = color_id
            break
    else:
        event.setdefault("colorId", DEFAULT_COLOR)
    return event



def ensure_timezone(event: dict) -> dict:
    for key in ("start", "end"):
        if key in event and isinstance(event[key], dict):
            if "dateTime" in event[key] and "timeZone" not in event[key]:
                event[key]["timeZone"] = DEFAULT_TZ
    return event



def validate_event(event: dict) -> bool:
    """Basic validation for required fields before attempting to add to calendar."""
    if not isinstance(event, dict):
        return False

    summary = event.get("summary")
    start = event.get("start", {})
    end = event.get("end", {})

    # Must have summary and a date or datetime in start + end
    if not summary or not isinstance(start, dict) or not isinstance(end, dict):
        return False

    if not ("dateTime" in start or "date" in start):
        return False
    if not ("dateTime" in end or "date" in end):
        return False

    return True



def get_event_start(e):
    """Return the start datetime or date string (RFC3339). Supports all-day and timed events."""
    start = e.get("start", {})
    return start.get("dateTime") or start.get("date") or "9999-01-01T00:00:00Z"



# === Time helpers ===
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

def loose_match(term: str, text: str, threshold=0.6) -> bool:
    """Check if term roughly matches text (case-insensitive)."""
    term, text = term.lower(), text.lower()
    return SequenceMatcher(None, term, text).ratio() >= threshold or term in text

# =========================================
# =========================================
def get_events(time_min: str | None = None,
               time_max: str | None = None,
               max_results: int = 500,
               q: str | None = None):
    """
    Pull events (paginated). If q is provided, uses Google API server-side search.
    Returns events sorted by startTime.
    """
    service = init_calendar_service()

    if not time_min:
        time_min = to_rfc3339(dt.datetime.utcnow())

    kwargs = dict(
        calendarId=CALENDAR_ID,
        timeMin=time_min,
        singleEvents=True,
        orderBy="startTime",
        maxResults=min(max_results, 250),
    )

    if time_max:
        kwargs["timeMax"] = time_max

    # ✅ Only include `q` if it's non-empty
    if q:
        kwargs["q"] = q

    items = []
    page_token = None
    remaining = max_results

    while True:
        if page_token:
            kwargs["pageToken"] = page_token

        resp = service.events().list(**kwargs).execute()
        batch = resp.get("items", [])
        items.extend(batch)
        remaining -= len(batch)

        page_token = resp.get("nextPageToken")
        if not page_token or remaining <= 0:
            break

    return items






def auto_fill_event(event: dict) -> dict:
    event = apply_color(event)
    event = ensure_timezone(event)
    event = fill_end_if_missing(event)
    return event




def add_events(events_data: dict | list[dict]):
    """Add one or more events to Google Calendar."""
    service = init_calendar_service()
    created = []

    # 🔍 Normalize to list if it's just a single event
    if isinstance(events_data, dict):
        events_data = [events_data]

    for evt in events_data:
        evt = auto_fill_event(evt)
        event = service.events().insert(calendarId=CALENDAR_ID, body=evt).execute()
        created.append(event)
        print("✅ Event created:", event.get("htmlLink"))

    return "\n".join([f"• {e.get('summary')} — {e.get('htmlLink')}" for e in created])






from difflib import SequenceMatcher

def loose_match(term: str, text: str, threshold=0.6) -> bool:
    """Check if term roughly matches text (case-insensitive)."""
    term, text = term.lower(), text.lower()
    return SequenceMatcher(None, term, text).ratio() >= threshold or term in text


def find_all(term_or_terms, horizon_years: int = 3):
    """Return ALL upcoming events matching any of the provided terms."""
    now = dt.datetime.utcnow()
    end = now.replace(year=now.year + horizon_years)

    # 🛠 Expand range backwards to catch near past
    safe_start = now - dt.timedelta(days=1)

    if isinstance(term_or_terms, str):
        term_or_terms = [term_or_terms]

    norm_terms = [normalize_text(t) for t in term_or_terms]

    print("🔍 Searching for:", norm_terms)
    results = get_events(
        time_min=to_rfc3339(safe_start),
        time_max=to_rfc3339(end),
        max_results=3000
    )

    matches = []
    for e in results:
        summary = normalize_text(e.get("summary", ""))
        if any(loose_match(t, summary) for t in norm_terms):
            print(f"✅ MATCHED: {summary}")
            matches.append(e)
        else:
            print(f"❌ SKIPPED: {summary}")

    # Dedupe by ID
    seen, unique = set(), []
    for e in matches:
        eid = e.get("id")
        if eid not in seen:
            seen.add(eid)
            unique.append(e)

    unique.sort(key=get_event_start)
    print(f"📦 Final matches: {len(unique)}")
    return unique





def find_year(year: int | None = None):
    """Return ALL events from now (or Jan 1st if future year) to end of given year."""
    now = dt.datetime.utcnow()
    if not year:
        year = now.year

    if year == now.year:
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        start = dt.datetime(year, 1, 1, 0, 0, 0)

    end = dt.datetime(year + 1, 1, 1, 0, 0, 0)

    results = get_events(
        time_min=to_rfc3339(start),
        time_max=to_rfc3339(end),
        max_results=1000
    )

    # De-dupe and sort
    seen, unique = set(), []
    for e in results:
        eid = e.get("id")
        if eid not in seen:
            seen.add(eid)
            unique.append(e)

    unique.sort(key=lambda e: e.get("start", {}).get("dateTime") or e.get("start", {}).get("date") or "9999")
    return unique



def find_all(term_or_terms, horizon_years: int = 3):
    """Return ALL upcoming events matching any of the provided terms."""
    now = dt.datetime.utcnow()
    end = now.replace(year=now.year + horizon_years)

    if isinstance(term_or_terms, str):
        term_or_terms = [term_or_terms]

    # Normalize all search terms
    norm_terms = [normalize_text(t) for t in term_or_terms]

    matches = []
    results = get_events(
        time_min=to_rfc3339(now),
        time_max=to_rfc3339(end),
        max_results=3000
    )

    for e in results:
        summary = normalize_text(e.get("summary", ""))
        if any(t in summary for t in norm_terms):
            matches.append(e)

    # Deduplicate
    seen, unique = set(), []
    for e in matches:
        eid = e.get("id")
        if eid not in seen:
            seen.add(eid)
            unique.append(e)

    unique.sort(key=get_event_start)
    return unique

def find_next(search_terms, horizon_years=3):
    """Return the next event (soonest match) for given term(s)."""
    all_events = find_all(search_terms, horizon_years=horizon_years)
    return [all_events[0]] if all_events else []




# === Response helper ===
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





# ====================
# === MAIN HANDLER ===
# ====================
def lambda_handler(event, context=None):
    print("🚀 Running calendar lambda v2.1 with all-day fix")
    print("📥 Event received:", event)

    # 🛡️ Tolerate API GW proxy format
    if isinstance(event, dict) and "body" in event and isinstance(event["body"], str):
        try:
            event = json.loads(event["body"] or "{}")
        except Exception:
            event = {}

    # 🔍 Inject GPT-parsed content if "messages" is present
    if "messages" in event:
        try:
            messages = [{"role": "system", "content": system_prompt}] + event.get("messages", [])
            response = client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            result = response.choices[0].message.content
            parsed = json.loads(result)
            print("🤖 Parsed by GPT:", parsed)

            # Merge parsed GPT result into the main event dict
            if isinstance(parsed, dict):
                event.update(parsed)

        except Exception as e:
            print("❌ GPT parse error:", e)
            return _resp({"error": "Failed to parse GPT response", "details": str(e)}, status=500)

    # 🎯 Continue as normal
    action = event.get("action")

    try:
        if action == "get":
            items = get_events(time_min=event.get("from"),
                               time_max=event.get("to"),
                               max_results=int(event.get("max_results", 500)))
            return _resp(items)

        elif action == "add":
            evts = event.get("event", {})
            if not evts:
                return _resp({"error": "No event data"}, status=400)

            if isinstance(evts, dict):
                evts = [evts]

            valid = [e for e in evts if validate_event(e)]
            if not valid:
                return _resp({"error": "Invalid event structure"}, status=400)

            created = add_events(valid)
            return _resp({"events": created})

        elif action == "find":
            found = find_events(term=event.get("term", "") or "",
                                time_min=event.get("from"),
                                time_max=event.get("to"),
                                max_results=int(event.get("max_results", 500)))
            return _resp(found)

        elif action == "get_month":
            year = int(event.get("year"))
            month = int(event.get("month"))
            tmin, tmax = month_bounds(year, month)
            items = get_events(time_min=tmin, time_max=tmax, max_results=1000)
            return _resp(items)

        elif action == "find_year":
            year = int(event.get("year", 0)) or None
            events = find_year(year)
            return _resp({"events": events})

        elif action == "get_all_upcoming":
            horizon_days = int(event.get("horizon_days", 365))
            tmin = to_rfc3339(dt.datetime.utcnow())
            tmax = to_rfc3339(dt.datetime.utcnow() + dt.timedelta(days=horizon_days))
            items = get_events(time_min=tmin, time_max=tmax, max_results=3000)
            return _resp(items)

        elif action == "find_next":
            term = event.get("term")
            terms = event.get("terms")
            search_terms = terms or term or ""
            events = find_next(search_terms, horizon_years=int(event.get("horizon_years", 3)))
            return _resp({"events": events})

        elif action == "find_all":
            term = event.get("term")
            terms = event.get("terms")
            search_terms = terms or term or ""
            events = find_all(search_terms, horizon_years=int(event.get("horizon_years", 3)))

            if events:
                return _resp({"events": events})
            else:
                return _resp({"events": [], "message": "No upcoming events found."})

        else:
            return _resp({"error": "Invalid action"}, status=400)

    except Exception as e:
        print("❌ Error:", repr(e))
        return _resp({"error": str(e)}, status=500)
