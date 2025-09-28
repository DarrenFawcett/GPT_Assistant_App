// 👇 Hard-coded for now, swap to env later if needed
export const API_BASE = "http"

// Core endpoints
export const CHAT_URL = `${API_BASE}/chat`;
export const CALENDAR_URL = `${API_BASE}/calendar`;
export const PING_URL = `${API_BASE}/ping`;
export const TOKEN_URL = `${API_BASE}/token`;

// Future modules (stub for now, point to API Gateway when ready)
export const TODO_URL = `${API_BASE}/todo`;
export const NOTES_URL = `${API_BASE}/notes`;
export const EMAIL_URL = `${API_BASE}/email`;

export function authHeaders(apiToken?: string, userToken?: string) {
  return {
    "Content-Type": "application/json",
    ...(apiToken ? { "X-Access-Token": apiToken } : {}),
    ...(userToken ? { "X-User-Token": userToken } : {}),
  };
}
