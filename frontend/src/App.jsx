import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { useMQTT }    from './hooks/useMQTT';
import Layout         from './components/Layout';
import Login          from './pages/Login';
import Dashboard      from './pages/Dashboard';
import EnvironmentView from './pages/EnvironmentView';
import SecurityView   from './pages/SecurityView';
import ProfileView    from './pages/ProfileView';
import Analytics      from './pages/Analytics';
import {
  canManageSystem,
  clearAuthSession,
  getStoredToken,
  getStoredUser,
} from './services/authSession';

// ─────────────────────────────────────────────────────────────
// AUTHENTICATED SHELL
// All internal navigation is state-based (no React Router inside).
// React Router is only used for the /login auth boundary.
// ─────────────────────────────────────────────────────────────
function AppShell({ currentUser, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard');
  const isAdmin = canManageSystem(currentUser);

  useEffect(() => {
    if (!isAdmin && activePage === 'security') {
      setActivePage('dashboard');
    }
  }, [activePage, isAdmin]);

  // Single global MQTT hook — all pages share one data source
  let mqtt;
  try {
    mqtt = useMQTT();
  } catch (e) {
    console.error('❌ useMQTT() error:', e);
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', gap: '12px', padding: '40px',
        background: 'linear-gradient(180deg, #352315 0%, #3D2818 100%)',
      }}>
        <p style={{ color: '#C8AA76', fontWeight: 700, fontSize: '18px' }}>Connection Error</p>
        <p style={{ color: '#E8D5B7', fontSize: '13px', maxWidth: '420px', textAlign: 'center', lineHeight: 1.6 }}>
          {e.message}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: '8px', padding: '10px 28px', background: '#C8AA76', color: '#352315',
            borderRadius: '999px', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '13px' }}
        >
          Reload
        </button>
      </div>
    );
  }
  const { isConnected, sensorData, deviceStates, commandLog, toggleDevice } = mqtt;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            sensorData={sensorData}
            deviceStates={deviceStates}
            commandLog={commandLog}
            toggleDevice={toggleDevice}
            isConnected={isConnected}
            canManageSystem={isAdmin}
          />
        );
      case 'security':
        if (!isAdmin) {
          return (
            <Dashboard
              sensorData={sensorData}
              deviceStates={deviceStates}
              commandLog={commandLog}
              toggleDevice={toggleDevice}
              isConnected={isConnected}
              canManageSystem={isAdmin}
            />
          );
        }
        return (
          <SecurityView
            sensorData={sensorData}
            commandLog={commandLog}
          />
        );
      case 'environment':
        return (
          <EnvironmentView
            sensorData={sensorData}
          />
        );
      case 'profile':
        return (
          <ProfileView
            isConnected={isConnected}
            currentUser={currentUser}
          />
        );
      case 'analytics':
        return <Analytics sensorData={sensorData} />;
      default:
        return null;
    }
  };

  return (
    <Layout
      activePage={activePage}
      setActivePage={setActivePage}
      isConnected={isConnected}
      onLogout={onLogout}
      currentUser={currentUser}
    >
      {renderPage()}
    </Layout>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT APP — handles auth boundary via React Router
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(getStoredToken())
  );
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());

  const handleLoginSuccess = (user) => {
    setCurrentUser(user || getStoredUser());
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="*"      element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return <AppShell currentUser={currentUser} onLogout={handleLogout} />;
}
