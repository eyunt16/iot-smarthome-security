import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import SecurityScreen from './src/screens/SecurityScreen';
import EnvironmentScreen from './src/screens/EnvironmentScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BottomNav from './src/components/BottomNav';
import { colors } from './src/theme/colors';

export default function App() {
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardScreen onLogout={() => setToken(null)} />;
      case 'security':
        return <SecurityScreen />;
      case 'environment':
        return <EnvironmentScreen />;
      case 'profile':
        return <ProfileScreen onLogout={() => setToken(null)} />;
      default:
        return <DashboardScreen onLogout={() => setToken(null)} />;
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      {!token ? (
        <LoginScreen onLoginSuccess={(newToken) => setToken(newToken)} />
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {renderScreen()}
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </View>
      )}
    </>
  );
}
