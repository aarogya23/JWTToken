import { API_URL } from '../config';

const TOKEN_KEY = 'jwtToken';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * @param {string} path
 * @param {RequestInit & { json?: object }} options
 */
export async function apiFetch(path, options = {}) {
  const { json, ...rest } = options;
  const headers = new Headers(rest.headers);

  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let body = rest.body;
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(json);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    body,
    headers,
    credentials: 'include',
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    let detail = res.statusText;
    try {
      if (isJson) {
        const errBody = await res.json();
        detail = errBody.message || errBody.error || JSON.stringify(errBody);
      } else {
        const text = await res.text();
        detail = text;
        try {
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed.error === 'string') {
            detail = parsed.error;
          }
        } catch {
          /* plain text */
        }
      }
    } catch {
      /* ignore */
    }
    const err = new Error(detail || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) {
    return null;
  }

  if (isJson) {
    return res.json();
  }
  return res.text();
}

/** Multipart upload (e.g. stories). Do not set Content-Type; browser sets boundary. */
export async function apiUpload(path, formData) {
  const headers = new Headers();
  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    body: formData,
    headers,
    credentials: 'include',
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `HTTP ${res.status}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
