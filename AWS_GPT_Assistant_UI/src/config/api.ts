// src/config/api.ts

// Load env vars
export const API_BASE = import.meta.env.VITE_API_BASE;
export const TEST_KEY = import.meta.env.VITE_TEST_KEY;

// Core endpoints
export const CHAT_URL = `${API_BASE}/chat`;
export const CALENDAR_URL = `${API_BASE}/calendar`;
export const PING_URL = `${API_BASE}/ping`;
export const TOKEN_URL = `${API_BASE}/token`;

// Future modules
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
console.log("🌍 Loaded API:", API_BASE, "Key:", TEST_KEY);
