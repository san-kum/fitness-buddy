import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import WorkoutLogger from './pages/WorkoutLogger';
import WorkoutSessionPage from './pages/WorkoutSessionPage';
import RunLogger from './pages/RunLogger';
import RunDetailPage from './pages/RunDetailPage';
import MealLogger from './pages/MealLogger';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';
import Login from './pages/Login';

import { TimerProvider } from './context/TimerContext';
import { api } from './lib/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        await api.identity.get();
        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <TimerProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/log/workout" element={<WorkoutLogger />} />
            <Route path="/log/workout/:id" element={<WorkoutSessionPage />} />
            <Route path="/log/run" element={<RunLogger />} />
            <Route path="/log/run/:id" element={<RunDetailPage />} />
            <Route path="/log/meal" element={<MealLogger />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TimerProvider>
  );
}

export default App;