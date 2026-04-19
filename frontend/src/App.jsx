import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Markets from './pages/Markets';
import MarketDetail from './pages/MarketDetail';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Squads from './pages/Squads';
import SquadDetail from './pages/SquadDetail';
import Crypto from './pages/Crypto';
import FraudShield from './pages/FraudShield';
import AdminDashboard from './pages/AdminDashboard';
import BackgroundOverlay from './components/BackgroundOverlay';
import CustomCursor from './components/CustomCursor';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const [showLoading, setShowLoading] = useState(true);

  if (showLoading) {
    return (
      <div className="relative min-h-screen">
        <BackgroundOverlay animated={false} />
        <CustomCursor />
        <div className="relative z-10" id="app">
          <LoadingScreen onComplete={() => setShowLoading(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <BackgroundOverlay animated={true} />
      <CustomCursor />
      <div className="relative z-10" id="app">
        <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/market/:id" element={<MarketDetail />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/squads" element={<Squads />} />
        <Route path="/squads/:id" element={<SquadDetail />} />
        <Route path="/crypto" element={<Crypto />} />
        <Route path="/fraud" element={<FraudShield />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route
        path="*"
        element={
          <Navigate to="/login" replace />
        }
      />
    </Routes>
      </div>
    </div>
  );
}

export default App;
