import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import SecurityScreen from './src/screens/SecurityScreen';
import EnvironmentScreen from './src/screens/EnvironmentScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BottomNav from './src/components/BottomNav';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { registerForPushNotificationsAsync } from './src/utils/notifications';
import { api } from './src/services/api';
import { canManageSystem } from './src/utils/roleUtils';

function MainAppContent() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); // Keep user role information
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isDark, themeColors } = useTheme();

  const handleLoginSuccess = async (newToken, loggedUser) => {
    setToken(newToken);
    setUser(loggedUser);
    
    try {
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) {
        // Must use the new token directly as api instance might not have it yet
        await api.post('/auth/push-token', { token: pushToken }, {
          headers: { Authorization: `Bearer ${newToken}` }
        });
        console.log('Successfully registered push token with backend');
      }
    } catch (err) {
      console.log('Failed to register push token', err);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
  };

  const renderScreen = () => {
    const isAdmin = canManageSystem(user);
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen onLogout={handleLogout} token={token} user={user} />;
      case 'security':
        return isAdmin ? <SecurityScreen token={token} user={user} /> : <DashboardScreen onLogout={handleLogout} token={token} user={user} />;
      case 'environment':
        return <EnvironmentScreen token={token} user={user} />;
      case 'profile':
        return <ProfileScreen onLogout={handleLogout} token={token} user={user} />;
      default:
        return <DashboardScreen onLogout={handleLogout} token={token} user={user} />;
    }
  };

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {!token ? (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        <View style={{ flex: 1, backgroundColor: themeColors.bg }}>
          {renderScreen()}
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} user={user} />
        </View>
      )}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainAppContent />
    </ThemeProvider>
  );
}
