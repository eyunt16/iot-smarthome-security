import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import DashboardCard from './DashboardCard';
import { colors } from '../theme/colors';
import { api } from '../services/api';

export default function SensorData() {
  const [data, setData] = useState({ temperature: null, humidity: null, motion: null });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchSensors = async () => {
      try {
        const res = await api.get('/data');
        if (mounted) {
          setData({
            temperature: res.temperature?.value ?? null,
            humidity: res.humidity?.value ?? null,
            motion: res.motion?.value !== undefined ? parseInt(res.motion.value) : null
          });
          setError(null);
        }
      } catch (err) {
        if (mounted) setError('Offline');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSensors();
    const interval = setInterval(fetchSensors, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Syncing Environment...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerBox, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30', borderWidth: 1 }]}>
        <Text style={styles.errorText}>No connection to hub.</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      <DashboardCard 
        title="Temperature"
        value={data.temperature !== null ? parseFloat(data.temperature).toFixed(1) : '--'}
        unit="°C"
        icon="🌡"
        colorHint={colors.cardAccentTemp}
      />
      <DashboardCard 
        title="Humidity"
        value={data.humidity !== null ? parseFloat(data.humidity).toFixed(1) : '--'}
        unit="%"
        icon="💧"
        colorHint={colors.cardAccentHum}
      />
      <DashboardCard 
        title="Motion"
        value={data.motion !== null ? (data.motion === 1 ? 'Yes' : 'No') : '--'}
        unit=""
        icon="🏃"
        colorHint={colors.cardAccentMot}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  centerBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    minHeight: 120,
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  errorText: {
    color: '#b91c1c',
    fontWeight: '600',
  }
});
