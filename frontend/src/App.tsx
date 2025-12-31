import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import WorkoutLogger from './pages/WorkoutLogger';
import WorkoutSessionPage from './pages/WorkoutSessionPage';
import RunLogger from './pages/RunLogger';
import RunDetailPage from './pages/RunDetailPage';
import MealLogger from './pages/MealLogger';
import Analytics from './pages/Analytics';
import Profile from './pages/Profile';

import { TimerProvider } from './context/TimerContext';

function App() {
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
                      <Route path="/log/meal" element={<MealLogger />} />            <Route path="/analytics" element={<Analytics />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TimerProvider>
  );
}

export default App;