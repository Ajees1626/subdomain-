/** localStorage JWT — same browser keeps session until expiry or logout */
export const AUTH_TOKEN_KEY = 'pixdot_auth_token'

export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(AUTH_TOKEN_KEY, token)
  else localStorage.removeItem(AUTH_TOKEN_KEY)
}

/** Backend origin in dev when `VITE_API_URL` is unset — calls go straight to Express (no Vite proxy). */
export const API_ORIGIN_DEV = 'http://localhost:4000'

function apiBase() {
  const fromEnv = String(import.meta.env.VITE_API_URL ?? '')
    .trim()
    .replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (import.meta.env.DEV) return API_ORIGIN_DEV
  return ''
}

async function authFetch(path, options = {}) {
  const url = `${apiBase()}${path}`
  const headers = { ...options.headers }
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const token = getStoredToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let res
  try {
    res = await fetch(url, { ...options, headers })
  } catch {
    const err = new Error(
      'Cannot reach the API. Start the backend: cd backend && npm run dev (must listen on port 4000).',
    )
    err.status = 0
    throw err
  }
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { error: text || 'Bad response' }
  }
  if (!res.ok) {
    let msg = data?.error || res.statusText || 'Request failed'
    if (res.status === 502 || res.status === 503) {
      msg =
        'API is not running or not reachable (Bad Gateway). Open a terminal and run: cd backend && npm run dev'
    }
    const err = new Error(msg)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export async function registerUser({ username, email, password, accountType = 'client' }) {
  return authFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, accountType }),
  })
}

export async function loginUser({ email, password, expectedRole }) {
  return authFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, ...(expectedRole ? { expectedRole } : {}) }),
  })
}

export async function fetchMe() {
  return authFetch('/api/auth/me', { method: 'GET' })
}
