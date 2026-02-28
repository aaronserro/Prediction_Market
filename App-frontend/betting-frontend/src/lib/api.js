const PROD_API_URL = import.meta.env.VITE_API_URL_PROD || 'https://api.pryzm.ca'
const DEV_API_URL = import.meta.env.VITE_API_URL_DEV || 'http://localhost:8080'
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PROD_API_URL : DEV_API_URL)


async function request(path, { method = 'GET', body, headers } = {}) {
const res = await fetch(`${API_URL}${path}`, {
method,
credentials: 'include', // send/receive HTTP-only cookie
headers: {
'Content-Type': 'application/json',
...(headers || {})
},
body: body ? JSON.stringify(body) : undefined,
})


const text = await res.text()
let data
try { data = text ? JSON.parse(text) : null } catch { data = text }


if (!res.ok) {
const msg = (data && (data.message || data.error)) || (typeof data === 'string' ? data : 'Request failed')
throw new Error(msg)
}
return data
}


export const api = {
signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
logout: () => request('/auth/logout', { method: 'POST' }),
me: () => request('/auth/me'),
}