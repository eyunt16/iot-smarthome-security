import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [initializing, setInitializing] = useState(true);
  const { isDark, themeColors } = useTheme();

  // On Startup: restore session from AsyncStorage
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        if (storedToken) {
          setToken(storedToken);
        }
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.log('Failed to restore session from AsyncStorage', err);
      } finally {
        setInitializing(false);
      }
    };
    restoreSession();
  }, []);

  const handleLoginSuccess = async (newToken, loggedUser) => {
    setToken(newToken);
    setUser(loggedUser);
    
    try {
      await AsyncStorage.setItem('token', newToken);
      await AsyncStorage.setItem('user', JSON.stringify(loggedUser));
    } catch (err) {
      console.log('Failed to persist session to AsyncStorage', err);
    }
    
    try {
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) {
        // Must use the new token directly as api instance might not have it yet
        await api.post('/auth/push-token', { token: pushToken }, newToken);
        console.log('Successfully registered push token with backend');
      }
    } catch (err) {
      console.log('Failed to register push token', err);
    }
  };

  const handleLogout = async () => {
    setToken(null);
    setUser(null);
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch (err) {
      console.log('Failed to remove session from AsyncStorage', err);
    }
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
