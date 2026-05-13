import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { api } from '../services/api';

export default function DeviceControl({ id, name, icon, initialState = false }) {
  const [isActive, setIsActive] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSwitch = async () => {
    // Optimistic UI updates are risky without strong sync, so we wait or lock the switch.
    setIsLoading(true);
    const newState = !isActive;
    
    try {
      const response = await api.post('/device/toggle', { device: id, state: newState ? '1' : '0' });
      if (response.status === 'success') {
        setIsActive(newState);
      }
    } catch (err) {
      Alert.alert('Connection Error', `Failed to toggle ${name}. Please check your network.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[
      styles.container, 
      isActive ? styles.containerActive : styles.containerInactive
    ]}>
      <View style={styles.leftGroup}>
        <View style={[
          styles.iconBg, 
          isActive ? { backgroundColor: colors.primary } : { backgroundColor: '#f1f5f9' }
        ]}>
          <Text>{icon}</Text>
        </View>
        <View>
          <Text style={[styles.name, isActive ? { color: '#fff' } : { color: colors.text }]}>
            {name}
          </Text>
          <Text style={[styles.statusInfo, isActive ? { color: '#e2e8f0' } : { color: colors.textMuted }]}>
            {isActive ? 'Powered On' : 'Standby'}
          </Text>
        </View>
      </View>

      <View style={styles.rightGroup}>
        {isLoading ? (
          <ActivityIndicator color={isActive ? '#fff' : colors.primary} />
        ) : (
          <Switch
            trackColor={{ false: '#cbd5e1', true: '#c4b5fd' }}
            thumbColor={isActive ? '#fff' : '#f8fafc'}
            ios_backgroundColor="#e2e8f0"
            onValueChange={toggleSwitch}
            value={isActive}
            disabled={isLoading}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  containerInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  containerActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusInfo: {
    fontSize: 13,
    fontWeight: '400',
  },
  rightGroup: {
    minWidth: 50,
    alignItems: 'flex-end',
  }
});
