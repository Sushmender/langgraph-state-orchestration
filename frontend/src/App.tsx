/**
 * App.tsx
 * Root application with routing, layout, and app initialization.
 */
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { LandingPage } from './pages/LandingPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { useWorkflow } from './hooks/useWorkflow';

function AppContent() {
  const { loadGraphSchema, loadThreads } = useWorkflow();
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([loadGraphSchema(), loadThreads()]).finally(() => setInitialized(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen flex flex-col dark bg-surface-900">
      <Header />
      <main className="flex-1 overflow-hidden">
        {initialized && (
          <Routes>
            <Route
              path="/"
              element={
                <LandingPage
                  onEnter={() => navigate('/workspace')}
                />
              }
            />
            <Route path="/workspace" element={<WorkspacePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
