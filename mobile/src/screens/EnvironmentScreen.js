import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { colors } from '../theme/colors';
import { api } from '../services/api';

export default function EnvironmentScreen() {
  const [temp, setTemp] = useState(22.4);
  const [humidity, setHumidity] = useState(48);
  const [airQuality, setAirQuality] = useState('Excellent');
  const [co2, setCo2] = useState(412);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnvironmentData();
  }, []);

  const fetchEnvironmentData = async () => {
    try {
      // Fetch sensor data from backend
      const response = await api.get('/sensors');
      if (response && response.sensors) {
        setTemp(response.sensors.temperature || 22.4);
        setHumidity(response.sensors.humidity || 48);
      }
      setLoading(false);
    } catch (err) {
      console.log('Error fetching environment data:', err);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Live Environment</Text>
          <Text style={styles.headerSubtitle}>Real-time sensor readings</Text>
        </View>

        {/* Primary Metrics */}
        <View style={styles.metricsRow}>
          {/* Temperature Card */}
          <View style={[styles.metricCard, styles.cardWarm]}>
            <Text style={styles.metricLabel}>Indoor Temp</Text>
            <Text style={styles.metricValue}>{temp.toFixed(1)}°C</Text>
            <View style={styles.metricIcon}>
              <Text style={styles.iconText}>🌡️</Text>
            </View>
          </View>

          {/* Humidity Card */}
          <View style={[styles.metricCard, styles.cardCool]}>
            <Text style={styles.metricLabel}>Humidity</Text>
            <Text style={styles.metricValue}>{humidity}%</Text>
            <View style={styles.metricIcon}>
              <Text style={styles.iconText}>💧</Text>
            </View>
          </View>
        </View>

        {/* Temperature Trend */}
        <View style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <View>
              <Text style={styles.trendTitle}>Temperature</Text>
              <Text style={styles.trendSubtitle}>Past 12 hours</Text>
            </View>
            <View style={styles.trendBadge}>
              <Text style={styles.trendValue}>+1.2°</Text>
              <Text style={styles.trendLabel}>TRENDING UP</Text>
            </View>
          </View>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartText}>📊 Chart visualization</Text>
          </View>
        </View>

        {/* Air Quality & CO2 */}
        <View style={styles.qualityRow}>
          <View style={[styles.qualityCard, styles.qualityGood]}>
            <View style={styles.qualityIcon}>
              <Text style={styles.iconText}>💨</Text>
            </View>
            <Text style={styles.qualityLabel}>AIR QUALITY</Text>
            <Text style={styles.qualityValue}>{airQuality}</Text>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
          </View>

          <View style={[styles.qualityCard, styles.qualityInfo]}>
            <View style={styles.qualityIcon}>
              <Text style={styles.iconText}>🌍</Text>
            </View>
            <Text style={styles.qualityLabel}>CO₂ LEVEL</Text>
            <Text style={styles.qualityValue}>{co2} ppm</Text>
            <Text style={styles.qualityNote}>Healthy range</Text>
          </View>
        </View>

        {/* Humidity Analysis */}
        <View style={styles.analysisCard}>
          <View style={styles.analysisHeader}>
            <Text style={styles.analysisTitle}>Humidity Analysis</Text>
            <View style={styles.analysisBadge}>
              <Text style={styles.analysisBadgeText}>48% AVG</Text>
            </View>
          </View>
          <Text style={styles.analysisValue}>Consistency</Text>
          <View style={styles.analysisChart}>
            <Text style={styles.chartPlaceholderText}>📈 Humidity trend</Text>
          </View>
          <Text style={styles.analysisDetail}>
            Humidity has remained within the comfort zone for 48 consecutive hours.
          </Text>
        </View>

        {/* Device Health */}
        <View style={styles.deviceSection}>
          <Text style={styles.sectionTitle}>Device Health</Text>
          <View style={styles.deviceItem}>
            <View style={styles.deviceIcon}>
              <Text>🏠</Text>
            </View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>Main Gateway</Text>
              <Text style={styles.deviceStatus}>ONLINE</Text>
            </View>
            <View style={styles.statusDot} />
          </View>
          <View style={styles.deviceItem}>
            <View style={styles.deviceIcon}>
              <Text>📡</Text>
            </View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>Living Room Sensor</Text>
              <Text style={styles.deviceBattery}>92%</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    justifyContent: 'space-between',
    height: 140,
  },
  cardWarm: {
    backgroundColor: '#FEF3C7',
  },
  cardCool: {
    backgroundColor: '#E0F2FE',
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
  },
  metricIcon: {
    alignSelf: 'flex-end',
  },
  iconText: {
    fontSize: 24,
  },
  trendCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  trendTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  trendSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  trendBadge: {
    alignItems: 'flex-end',
  },
  trendValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
  trendLabel: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '600',
  },
  chartPlaceholder: {
    height: 120,
    backgroundColor: colors.background,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  chartPlaceholderText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  qualityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  qualityCard: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
  },
  qualityGood: {
    backgroundColor: '#E8F5E9',
  },
  qualityInfo: {
    backgroundColor: '#E3F2FD',
  },
  qualityIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  qualityLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  qualityValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    width: '75%',
    height: '100%',
    backgroundColor: colors.success,
  },
  qualityNote: {
    fontSize: 11,
    color: colors.success,
    marginTop: 8,
    fontWeight: '500',
  },
  analysisCard: {
    backgroundColor: '#2D5016',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C4E3AC',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  analysisBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  analysisBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C4E3AC',
  },
  analysisValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  analysisChart: {
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  analysisDetail: {
    fontSize: 13,
    color: '#C4E3AC',
    lineHeight: 20,
  },
  deviceSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  deviceIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 40,
    textAlign: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  deviceStatus: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
    marginTop: 2,
  },
  deviceBattery: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
});
