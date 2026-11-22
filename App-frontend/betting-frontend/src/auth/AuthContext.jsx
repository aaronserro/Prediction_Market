import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api.js'


const AuthCtx = createContext(null)


export function AuthProvider({ children }) {
const [user, setUser] = useState(null)
const [loading, setLoading] = useState(true)


const refresh = useCallback(async () => {
try {
const me = await api.me()
const authenticatedUser = me?.username ? me : null
setUser(authenticatedUser)
return authenticatedUser
} catch {
setUser(null)
return null
} finally {
setLoading(false)
}
}, [])


useEffect(() => { refresh() }, [refresh])


const value = {
user,
loading,
login: async (username, password, mfaCode) => {
const res = await api.login({ username, password, ...(mfaCode ? { mfaCode } : {}) })
return await refresh() ?? res
},
signup: async (username, email, password) => {
const res = await api.signup({ username, email, password })
return await refresh() ?? res
},
logout: async () => {
try {
await api.logout()
} catch (error) {
// A 401 means the server already considers this browser signed out.
if (error.status !== 401) throw error
}
setUser(null)
}
}


return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}


export function useAuth() {
const ctx = useContext(AuthCtx)
if (!ctx) throw new Error('useAuth must be used within AuthProvider')
return ctx
}

