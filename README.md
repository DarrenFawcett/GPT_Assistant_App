# 🧠 GPT Assistant

GPT Assistant is a personal AI-powered assistant that combines OpenAI’s GPT with AWS services to create a smart, serverless productivity tool.

---

## 🧰 Tech Stack

React · Tailwind · Vite · AWS Lambda · OpenAI · Google Calendar API · S3 · Python

---

## ✨ Features

- 🧠 Natural language chat  
- 📆 Calendar event creation from plain text (e.g., "Dentist on 9th Dec at 3pm")  
- 🖼️ Image uploads to an S3 bucket for further processing  
- 🔄 Real-time calendar syncing via Lambda → GPT → Google Calendar  
- ⚙️ Serverless backend with token-aware logic and warm Lambda handling  
- 🧠 Smart prompt routing to handle event creation, search, filtering  

---

## 🧱 Architecture Evolution

### 🧪 Stage 1 – Connect to OpenAI API

Basic chat handling via Lambda.

### 🔐 Stage 2 – Token Validation + Secure API

UI sends temporary user token, backend verifies and routes requests securely.

### 🚀 Stage 3 – Calendar Integration + Warm Lambda

- Connects OpenAI + Google Calendar  
- Calendar Lambda upgraded for:
  - ✅ Direct invocation from GPT Lambda
  - ✅ Cleaner event formatting
  - ✅ Cross-platform datetime formatting
  - ✅ Built-in popup reminders (2-day default)
- Adds `CALENDAR_INVOKE_TYPE = RequestResponse` for fast, round-trip confirmation  
- 💡 Added warm-up `/ping` route to pre-wake Lambda functions

### ⚡️ New Lambda Enhancements (Sep 2025)

- 🧠 GPT Lambda now detects and auto-creates `calendar_event` JSON  
- 🔁 Invokes Google Calendar Lambda in real-time (`RequestResponse`)  
- 🎯 Environment-aware token loading  
  - `dev-token.json` (for local testing)  
  - `lambda-token.json` (auto-loaded from S3 at runtime)  
- ✅ Modular sync structure for adding, finding, listing events  
- 🔒 Secure S3 bucket policy for Lambda-only access to token  

---

## 🔧 Calendar Lambda Routes

| Prompt                          | What it does                                 |
|---------------------------------|-----------------------------------------------|
| "add dentist on 10 Oct at 2:30" | ✅ Adds + returns UI calendar card            |
| "when is my next dentist?"      | 📅 Finds and returns matching event           |
| "what’s on this year?"          | 📆 All events for current year                |
| "show all events next 45 days"  | 🔭 Horizon search for upcoming events         |
| "what’s on in October 2025?"    | 🗓️ Month view                                |
| "find dentist this month"       | 🔎 Month + keyword filtering                  |

Handled by:

```python
parse_calendar_query() → 
  → add_event  
  → find_next  
  → get_month  
  → get_year  
  → get_all_upcoming
```

---

## 🔔 Built-in Reminders

Each new event includes a 2-day popup reminder:

```json
"reminders": {
  "useDefault": false,
  "overrides": [
    { "method": "popup", "minutes": 2880 }
  ]
}
```

---

## 🧠 Smarter Calendar Cards

Now returns rich `calendar_added` cards to the UI with:

```json
{
  "title": "Dentist",
  "subtitle": "Fri 10 Oct, 2:30pm – 3:30pm · 1hr",
  "link": "https://calendar.google.com/calendar/u/0/r/eventedit/..."
}
```

Rendered in the UI as:

- 📌 Title → event summary  
- 🕒 Subtitle → time + duration  
- 🔗 Link → “Open in Calendar” button  

---

## 🔐 Dual Token Setup

| Environment | Token File          | Description                  |
|-------------|---------------------|------------------------------|
| 🧪 Local     | `dev-token.json`     | Stored locally for testing   |
| ☁️ AWS       | `lambda-token.json`  | Pulled from S3 at runtime    |

Code auto-selects based on environment using:

```python
env = os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
```

---

## 🧩 Assistant's Growing Brain

This system is designed to evolve into a smarter, more proactive assistant by:

- Understanding natural language (via GPT)  
- Taking action (via Python + Lambda agents)  
- Syncing schedules (Google Calendar API)  
- Managing uploads (via S3 + metadata)  
- Learning preferences over time  
- Operating 100% serverless (AWS-native)  

---

## 🚀 Deployment Guide (Coming Soon)

Planned additions:

- ✅ Static hosting on S3  
- ✅ Lambda packaging with OpenAI + calendar dependencies  
- ✅ Token routing: local vs S3  
- ✅ Basic Auth via CloudFront  
- 🔐 Environment variables setup  
- 🌐 Custom domain + HTTPS support  

---