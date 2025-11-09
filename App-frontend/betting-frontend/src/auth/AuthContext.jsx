import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api.js'


const AuthCtx = createContext(null)


export function AuthProvider({ children }) {
const [user, setUser] = useState(null)
const [loading, setLoading] = useState(true)


const refresh = useCallback(async () => {
try {
const me = await api.me()
setUser(me?.username ? me : null)
} catch {
setUser(null)
} finally {
setLoading(false)
}
}, [])


useEffect(() => { refresh() }, [refresh])


const value = {
user,
loading,
login: async (username, password) => {
const res = await api.login({ username, password })
await refresh()
return res
},
signup: async (username, email, password) => {
const res = await api.signup({ username, email, password })
await refresh()
return res
},
logout: async () => {
await api.logout()
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

