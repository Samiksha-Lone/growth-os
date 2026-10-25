import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AppShell } from './components/ui/AppShell';
import LoginPage from './pages/LoginPage';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PlannerPage = lazy(() => import('./pages/PlannerPage'));
const JournalPage = lazy(() => import('./pages/JournalPage'));
const HabitsPage = lazy(() => import('./pages/HabitsPage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const RealityCheckPage = lazy(() => import('./pages/RealityCheckPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));

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
      <Route
        path="/*"
        element={(
          <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-zinc-400">Loading page...</div>}>
            <AppShell />
          </Suspense>
        )}
      >
        {protectedRoutes.map((route) => (
          <Route key={route.path} path={route.path.slice(1)} element={route.element} />
        ))}
        <Route path="reflection" element={<Navigate to="/journal" replace />} />
        <Route path="" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
