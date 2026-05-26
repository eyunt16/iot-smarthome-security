import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { canManageSystem } from '../utils/roleUtils';

export default function BottomNav({ activeTab, onTabChange, user }) {
  const { themeColors } = useTheme();
  const isAdmin = canManageSystem(user);
  
  const tabs = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    ...(isAdmin ? [{ id: 'security', icon: '🛡️', label: 'Security' }] : []),
    { id: 'environment', icon: '🌱', label: 'Environment' },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.card, borderTopColor: themeColors.border }]}>
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tab, activeTab === tab.id && styles.tabActive]}
          onPress={() => onTabChange(tab.id)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text style={[
            styles.tabLabel, 
            { color: activeTab === tab.id ? themeColors.accent : themeColors.textMuted },
            activeTab === tab.id && styles.tabLabelActive
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 8,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabActive: {
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});
