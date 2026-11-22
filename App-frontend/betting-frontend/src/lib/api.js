const PROD_API_URL = import.meta.env.VITE_API_URL_PROD || 'https://api.pryzm.ca'
const DEV_API_URL = import.meta.env.VITE_API_URL_DEV || 'http://localhost:8080'
export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PROD_API_URL : DEV_API_URL)

let csrfPromise

export async function csrfHeaders() {
	if (!csrfPromise) {
		csrfPromise = fetch(`${API_URL}/auth/csrf`, { credentials: 'include' })
			.then(async (res) => {
				if (!res.ok) throw await responseError(res)
				const data = await res.json()
				if (!data?.headerName || !data?.token) throw new Error('Invalid CSRF response')
				return { [data.headerName]: data.token }
			})
			.catch((error) => {
				csrfPromise = undefined
				throw error
			})
	}
	return csrfPromise
}

async function parseResponse(res) {
	if (res.status === 204) return null
	const text = await res.text()
	if (!text) return null
	try { return JSON.parse(text) } catch { return text }
}

async function responseError(res) {
	const data = await parseResponse(res)
	const message = (data && typeof data === 'object' && (data.message || data.error))
		|| (typeof data === 'string' ? data : 'Request failed')
	const error = new Error(message)
	error.status = res.status
	error.code = data && typeof data === 'object' ? data.code ?? null : null
	return error
}

export async function request(path, { method = 'GET', body, headers = {} } = {}) {
	const normalizedMethod = method.toUpperCase()
	const mutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(normalizedMethod)
	const mutationHeaders = mutation ? await csrfHeaders() : {}
	const res = await fetch(`${API_URL}${path}`, {
		method: normalizedMethod,
		credentials: 'include',
		headers: {
			...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
			...mutationHeaders,
			...headers,
		},
		body: body !== undefined ? JSON.stringify(body) : undefined,
	})

	if (!res.ok) throw await responseError(res)
	return parseResponse(res)
}

async function authRequest(path, options) {
	// Authentication changes can invalidate the CSRF token associated with the
	// previous browser state. Always acquire a fresh token for each transition.
	csrfPromise = undefined
	try {
		return await request(path, options)
	} finally {
		csrfPromise = undefined
	}
}

export function newIdempotencyKey() {
	return crypto.randomUUID()
}


export const api = {
	signup: (payload) => authRequest('/auth/signup', { method: 'POST', body: payload }),
	login: (payload) => authRequest('/auth/login', { method: 'POST', body: payload }),
	logout: () => authRequest('/auth/logout', { method: 'POST' }),
	me: () => request('/auth/me'),
}
