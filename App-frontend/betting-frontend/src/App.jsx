import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import Login from './auth/Login.jsx';
import Signup from './auth/Signup.jsx';
import Dashboard from './dashboard/Dashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';
import Settings from './dashboard/Settings.jsx';
import Wallet from './dashboard/Wallet.jsx';
export default function App() {
  return (
    <AuthProvider>
      <div style={{ minHeight: '100vh', width: '100%' }}>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} /> {/* added */}
        </Routes>
      </div>
    </AuthProvider>
  );
}
