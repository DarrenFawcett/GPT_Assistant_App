import json
import os
import tempfile
import datetime as dt
import boto3
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

# === ENV VARS ===
S3_BUCKET    = os.environ.get("S3_BUCKET_NAME", "gpt-assistant-static-web-app")
S3_TOKEN_KEY = os.environ.get("S3_TOKEN_KEY", "token/token_lambda.json")
DEFAULT_TZ   = os.environ.get("DEFAULT_TZ", "Europe/London")
CALENDAR_ID  = os.environ.get("CALENDAR_ID", "primary")

# === CONSTANTS ===
SCOPES = ["https://www.googleapis.com/auth/calendar"]

# === S3 CLIENT ===
s3 = boto3.client("s3")

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

# === Color logic (annual leave/work -> RED, else YELLOW) ===
COLOR_KEYWORDS = {
    "annual leave": "11", "annual-leave": "11", "holiday": "11", "vacation": "11", "leave": "11",
    "work": "11", "shift": "11", "on call": "11", "on-call": "11", "cover": "11", "overtime": "11",
    "work related": "11", "work-related": "11",
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

def ensure_timezone(event: dict) -> dict:
    for key in ("start", "end"):
        if key in event and isinstance(event[key], dict):
            if "dateTime" in event[key] and "timeZone" not in event[key]:
                event[key]["timeZone"] = DEFAULT_TZ
    return event

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

# === Core reads/writes (with q + pagination) ===
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
        maxResults=min(max_results, 250),  # per page limit
    )
    if time_max:
        kwargs["timeMax"] = time_max
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

def add_event(event_data: dict):
    service = init_calendar_service()
    event_data = ensure_timezone(apply_color(event_data))
    event = service.events().insert(calendarId=CALENDAR_ID, body=event_data).execute()
    print("✅ Event created:", event.get("htmlLink"))
    return event

def find_events(term: str,
                time_min: str | None = None,
                time_max: str | None = None,
                max_results: int = 500):
    # Use API q filter first (much better than local contains)
    items = get_events(time_min=time_min, time_max=time_max, max_results=max_results, q=term)

    # Fallback: ensure anything with summary contains term is included
    term_l = (term or "").lower()
    extra = [e for e in items if term_l in (e.get("summary", "") or "").lower()]
    # De-dupe
    seen, out = set(), []
    for e in items + extra:
        eid = e.get("id")
        if eid not in seen:
            seen.add(eid)
            out.append(e)
    return out

def find_next(term_or_terms, horizon_years: int = 3):
    """Next upcoming matching any of the provided terms."""
    now = dt.datetime.utcnow()
    end = now.replace(year=now.year + horizon_years)

    if isinstance(term_or_terms, str):
        term_or_terms = [term_or_terms]

    matches = []
    for term in term_or_terms:
        results = get_events(time_min=to_rfc3339(now),
                             time_max=to_rfc3339(end),
                             max_results=1000,
                             q=term)
        matches.extend(results)

    # Sort by start time
    matches.sort(key=lambda e: e.get("start", {}).get("dateTime", "9999"))
    return matches[0] if matches else None


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

# === MAIN HANDLER ===
def lambda_handler(event, context=None):
    print("📥 Event received:", event)

    # Tolerate API GW proxy format
    if isinstance(event, dict) and "body" in event and isinstance(event["body"], str):
        try:
            event = json.loads(event["body"] or "{}")
        except Exception:
            event = {}

    action = (event or {}).get("action")
    try:
        if action == "get":
            items = get_events(time_min=event.get("from"),
                               time_max=event.get("to"),
                               max_results=int(event.get("max_results", 500)))
            return _resp(items)

        elif action == "add":
            evt = event.get("event", {}) or {}
            if not evt:
                return _resp({"error": "No event data"}, status=400)
            created = add_event(evt)
            return _resp(created)

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

        elif action == "get_year":
            year = int(event.get("year"))
            tmin, tmax = year_bounds(year)
            items = get_events(time_min=tmin, time_max=tmax, max_results=2000)
            return _resp(items)

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
            nxt = find_next(search_terms, horizon_years=int(event.get("horizon_years", 3)))
            return _resp(nxt or {"message": "No upcoming events found."})

        else:
            return _resp({"error": "Invalid action"}, status=400)

    except Exception as e:
        print("❌ Error:", repr(e))
        return _resp({"error": str(e)}, status=500)
