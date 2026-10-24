import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AppShell } from './components/ui/AppShell';
import DashboardPage from './pages/DashboardPage';
import PlannerPage from './pages/PlannerPage';
import JournalPage from './pages/JournalPage';
import HabitsPage from './pages/HabitsPage';
import GoalsPage from './pages/GoalsPage';
import InsightsPage from './pages/InsightsPage';
import RealityCheckPage from './pages/RealityCheckPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import HistoryPage from './pages/HistoryPage';

const protectedRoutes = [
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/planner', element: <PlannerPage /> },
  { path: '/journal', element: <JournalPage /> },
  { path: '/habits', element: <HabitsPage /> },
  { path: '/goals', element: <GoalsPage /> },
  { path: '/analytics', element: <Navigate to="/insights" replace /> },
  { path: '/insights', element: <InsightsPage /> },
  { path: '/reality-check', element: <RealityCheckPage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '/history', element: <HistoryPage /> }
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
        <Route path="reflection" element={<Navigate to="/journal" replace />} />
        <Route path="" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
