import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'


export default function ProtectedRoute({ children }) {
const { user, loading } = useAuth()
if (loading) return <div className="grid place-items-center h-[60vh]">Loading…</div>
if (!user) return <Navigate to="/login" replace />
return children
}