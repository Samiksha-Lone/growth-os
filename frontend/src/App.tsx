import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AppShell } from './components/ui/AppShell';
import DashboardPage from './pages/DashboardPage';
import PlannerPage from './pages/PlannerPage';
import TrackerPage from './pages/TrackerPage';
import ReflectionPage from './pages/ReflectionPage';
import HabitsPage from './pages/HabitsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import InsightsPage from './pages/InsightsPage';
import RealityCheckPage from './pages/RealityCheckPage';
import PomodoroPage from './pages/PomodoroPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

const protectedRoutes = [
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/planner', element: <PlannerPage /> },
  { path: '/tracker', element: <TrackerPage /> },
  { path: '/reflection', element: <ReflectionPage /> },
  { path: '/habits', element: <HabitsPage /> },
  { path: '/analytics', element: <AnalyticsPage /> },
  { path: '/insights', element: <InsightsPage /> },
  { path: '/reality-check', element: <RealityCheckPage /> },
  { path: '/pomodoro', element: <PomodoroPage /> },
  { path: '/settings', element: <SettingsPage /> }
];

function App() {
  const { token } = useAuth();
  const location = useLocation();

  if (!token && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<AppShell />}> 
        {protectedRoutes.map((route) => (
          <Route key={route.path} path={route.path.slice(1)} element={route.element} />
        ))}
        <Route path="" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
