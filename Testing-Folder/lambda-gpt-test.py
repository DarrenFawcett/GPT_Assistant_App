from openai import OpenAI
from datetime import datetime, timedelta
from dotenv import load_dotenv
from pathlib import Path
from zoneinfo import ZoneInfo
import unicodedata
import pandas as pd
import ast
import json
import re

# 🔐 Load .env
env_path = Path(__file__).parent.parent / ".ignore_files" / "assistant-core" / ".env"
load_dotenv(dotenv_path=env_path)

client = OpenAI()

# === Load CSV Test Data ===
def load_test_cases_from_csv(file_path):
    df = pd.read_csv(file_path)
    test_cases = []
    for _, row in df.iterrows():
        try:
            expected = ast.literal_eval(row["expected_result"])
            test_cases.append({
                "user_input": row["user_input"],
                "expected_result": expected
            })
        except Exception as e:
            print(f"⚠️ Error parsing row: {e}")
    return test_cases

csv_path = Path(__file__).parent / "test_data" / "Calendar_Add_Test_Cases_UPDATED.csv"
test_data = load_test_cases_from_csv(csv_path)

# === Helpers ===

def normalize_quotes(text):
    return unicodedata.normalize("NFKD", text).replace("’", "'")

def clean(text):
    normalized = normalize_quotes(text)
    return re.sub(r'[^a-zA-Z0-9 ]', '', normalized.lower().strip())

def similar_summary(a, b):
    return clean(a) in clean(b) or clean(b) in clean(a)

def is_reasonable_match(actual, expected):
    try:
        actual_start = datetime.fromisoformat(actual["start"])
        expected_start = datetime.fromisoformat(expected["start"])
    except Exception:
        return False

    try:
        actual_end = datetime.fromisoformat(actual["end"])
        expected_end = datetime.fromisoformat(expected["end"])
        duration_difference = abs((actual_end - actual_start) - (expected_end - expected_start))
        duration_ok = duration_difference < timedelta(minutes=45)
    except Exception:
        duration_ok = True

    return similar_summary(actual["summary"], expected["summary"]) and duration_ok

def manual_check(parsed_result, expected):
    if parsed_result:
        if is_reasonable_match(parsed_result, expected):
            print("✅ PASS (soft match)")
            return True
        else:
            print("❌ FAIL")
            print("🔍 Reason(s):")
            if not similar_summary(parsed_result["summary"], expected["summary"]):
                print("  • Summary mismatch")
            if parsed_result["start"] != expected["start"]:
                print("  • Start time differs")
            if parsed_result["end"] != expected["end"]:
                print("  • End time differs (±45min allowed)")
            return False
    else:
        print("❌ FAIL — No valid parsed result")
        return False

# === Prompt ===
from datetime import datetime
from zoneinfo import ZoneInfo

def build_calendar_parser_prompt():
    today_date = datetime.now(ZoneInfo("Europe/London")).strftime("%Y-%m-%d")
    return (
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

def report_token_usage(model_used, prompt_tokens, completion_tokens):
    total_tokens = prompt_tokens + completion_tokens

    print("\n📊 Token Usage Summary")
    print(f"🔢 Model Used: {model_used}")
    print(f"📝 Prompt Tokens: {prompt_tokens}")
    print(f"🧠 Completion Tokens: {completion_tokens}")
    print(f"📦 Total Tokens: {total_tokens}")

    # 💰 Estimate cost based on GPT-4 pricing (as of 2025)
    if "gpt-4o" in model_used or "preview" in model_used:
        cost_in = prompt_tokens / 1000 * 0.01
        cost_out = completion_tokens / 1000 * 0.03
    else:
        cost_in = prompt_tokens / 1000 * 0.03
        cost_out = completion_tokens / 1000 * 0.06

    total_cost = cost_in + cost_out
    print(f"💵 Estimated Cost: ${total_cost:.4f} (input: ${cost_in:.4f}, output: ${cost_out:.4f})")

# === Main test loop ===
def test_loop_with_gpt():
    failed_results = []
    passed_count = 0

    # === Clean and prepare all user inputs ===
    cleaned_inputs = []
    for i, test in enumerate(test_data, start=1):
        cleaned = re.sub(r'[^a-zA-Z0-9 ]', '', test["user_input"])
        cleaned_inputs.append(f"{i}. {cleaned}")

    # === Build multi-input prompt ===
    prompt = build_calendar_parser_prompt() + "\n\n"
    prompt += "Below is a list of multiple user inputs. For each one, return a valid calendar event JSON in a list, in the same order:\n\n"
    prompt += "\n".join(cleaned_inputs)
    prompt += "\n\nReturn a Python-style list of JSON objects — one per item."

    print("📤 Sending batch to GPT...\n")

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "system", "content": prompt}],
            temperature=0.3
        )

        # === Capture token usage ===
        model_used = response.model
        prompt_tokens = response.usage.prompt_tokens
        completion_tokens = response.usage.completion_tokens

        result_text = response.choices[0].message.content.strip()

        # === Try to parse response as list of dicts ===
        try:
            parsed_results = ast.literal_eval(result_text)
        except Exception:
            print("❌ ERROR: GPT did not return valid Python list. Raw output:")
            print(result_text)
            return

        if not isinstance(parsed_results, list):
            print("❌ ERROR: GPT response was not a list.")
            print(result_text)
            return

        # === Compare each result to expected ===
        for i, (test, parsed_result) in enumerate(zip(test_data, parsed_results), start=1):
            user_input = test["user_input"]
            expected = test["expected_result"]

            # Add 30min end if missing
            # Unpack the first event inside "events"
            if parsed_result and isinstance(parsed_result, dict) and "events" in parsed_result:
                parsed_event = parsed_result["events"][0]  # Only test the first event for now
            else:
                parsed_event = parsed_result  # fallback

            # Add 30 min end if missing
            if parsed_event and "start" in parsed_event and "end" not in parsed_event:
                try:
                    start_dt = datetime.fromisoformat(parsed_event["start"])
                    parsed_event["end"] = (start_dt + timedelta(minutes=30)).isoformat()
                except Exception as e:
                    print(f"⚠️ Could not add end time for Test {i}: {e}")

            print(f"\n🧪 Test {i}: {user_input}")
            if "action" in parsed_result:
                print(f"🧭 Action: {parsed_result['action']}")
            print(json.dumps(parsed_event, indent=2))
            print("\n✅ Expected:")
            print(json.dumps(expected, indent=2))

            if manual_check(parsed_event, expected):
                passed_count += 1
            else:
                failed_results.append({
                    "test_num": i,
                    "input": user_input,
                    "expected": expected,
                    "actual": parsed_result
                })

            print("\n" + "-" * 50)

        # === Save failed results ===
        out_path = Path(__file__).parent / "test_data" / "failed_tests.json"
        if failed_results:
            with open(out_path, "w") as f:
                json.dump(failed_results, f, indent=2)
            print(f"\n❌ {len(failed_results)} tests failed. See: {out_path}")
        else:
            print("\n✅ All tests passed!")

        print(f"\n🔢 {passed_count} passed / {len(test_data)} total")

        # === Token usage report ===
        report_token_usage(model_used, prompt_tokens, completion_tokens)

    except Exception as e:
        print(f"💥 GPT Call Failed: {str(e)}")
        return

# === Run ===
if __name__ == "__main__":
    test_loop_with_gpt()
