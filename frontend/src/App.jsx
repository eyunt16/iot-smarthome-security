import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { useMQTT } from './hooks/useMQTT';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import EnvironmentView from './pages/EnvironmentView';
import SecurityView from './pages/SecurityView';
import ProfileView from './pages/ProfileView';
import Analytics from './pages/Analytics';
import {
  AUTH_STATE_CHANGE_EVENT,
  canManageSystem,
  clearAuthSession,
  getStoredToken,
  getStoredUser,
} from './services/authSession';

function AppShell({ currentUser, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard');
  const isAdmin = canManageSystem(currentUser);

  useEffect(() => {
    if (!isAdmin && activePage === 'security') {
      setActivePage('dashboard');
    }
  }, [activePage, isAdmin]);

  let mqtt;
  try {
    mqtt = useMQTT();
  } catch (e) {
    console.error('useMQTT() error:', e);
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '12px',
          padding: '40px',
          background: 'linear-gradient(180deg, #352315 0%, #3D2818 100%)',
        }}
      >
        <p style={{ color: '#C8AA76', fontWeight: 700, fontSize: '18px' }}>
          Connection Error
        </p>
        <p
          style={{
            color: '#E8D5B7',
            fontSize: '13px',
            maxWidth: '420px',
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          {e.message}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '8px',
            padding: '10px 28px',
            background: '#C8AA76',
            color: '#352315',
            borderRadius: '999px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Reload
        </button>
      </div>
    );
  }

  const {
    isConnected,
    sensorData: hookSensorData,
    allRoomsData,
    telemetryMeta,
    deviceStates,
    commandLog,
    toggleDevice,
  } = mqtt;

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            sensorData={hookSensorData}
            deviceStates={deviceStates}
            commandLog={commandLog}
            toggleDevice={toggleDevice}
            isConnected={isConnected}
            allRoomsData={allRoomsData}
            canManageSystem={isAdmin}
          />
        );
      case 'security':
        if (!isAdmin) {
          return (
            <Dashboard
              sensorData={hookSensorData}
              deviceStates={deviceStates}
              commandLog={commandLog}
              toggleDevice={toggleDevice}
              isConnected={isConnected}
              allRoomsData={allRoomsData}
              canManageSystem={isAdmin}
            />
          );
        }
        return (
          <SecurityView
            sensorData={hookSensorData}
            commandLog={commandLog}
          />
        );
      case 'environment':
        return <EnvironmentView sensorData={allRoomsData} telemetryMeta={telemetryMeta} />;
      case 'profile':
        return (
          <ProfileView
            isConnected={isConnected}
            currentUser={currentUser}
          />
        );
      case 'analytics':
        return <Analytics sensorData={hookSensorData} />;
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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(getStoredToken())
  );
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(Boolean(getStoredToken()));
      setCurrentUser(getStoredUser());
    };

    window.addEventListener('storage', syncAuthState);
    window.addEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthState);

    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener(AUTH_STATE_CHANGE_EVENT, syncAuthState);
    };
  }, []);

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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return <AppShell currentUser={currentUser} onLogout={handleLogout} />;
}
