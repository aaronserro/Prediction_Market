import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import Login from './auth/Login.jsx';
import Signup from './auth/Signup.jsx';
import Dashboard from './dashboard/Dashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Navbar from './components/Navbar.jsx';
import Settings from './dashboard/Settings.jsx';
import Wallet from './dashboard/Wallet.jsx';
import AdminDashboard from './dashboard/admin/AdminDashboard.jsx';
import AdminFundRequests from './dashboard/admin/AdminFundRequsts.jsx';
import MarketsEvents from './dashboard/admin/MarketsEvents.jsx';
import AdminMarketEdit from './dashboard/admin/AdminMarketEdit.jsx';
import Markets from './pages/Markets.jsx';
import PortfolioPage from './pages/PortfolioPage.jsx';
import NewsPage from './pages/NewsPage.jsx';
import TournamentsPage from './pages/TournamentsPage.jsx';
import RootRedirect from './components/RootRedirect.jsx';
import LandingPage from './components/LandingPage.jsx';
import { useAuth } from './auth/AuthContext.jsx';
import MarketDetail from './pages/MarketDetail.jsx';

function HomeRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    return <RootRedirect />;
  }

  return <LandingPage />;
}
export default function App() {
  return (
    <AuthProvider>
      <div style={{ minHeight: '100vh', width: '100%' }}>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomeRoute />} />
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
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="/markets" element={<ProtectedRoute><Markets /></ProtectedRoute>} />
          <Route path="/portfolio" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
          <Route path="/news" element={<ProtectedRoute><NewsPage /></ProtectedRoute>} />
          <Route path="/tournaments" element={<ProtectedRoute><TournamentsPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/fund-requests" element={<ProtectedRoute><AdminFundRequests /></ProtectedRoute>} />
          <Route path="/admin/markets-events" element={<ProtectedRoute><MarketsEvents /></ProtectedRoute>} />
          <Route path="/admin/markets/:marketId" element={<ProtectedRoute><AdminMarketEdit /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
          <Route path="/markets/:marketId" element={<MarketDetail />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}
