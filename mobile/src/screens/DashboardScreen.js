import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { api } from '../services/api';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export default function DashboardScreen({ onLogout }) {
  const [temp, setTemp] = useState(24.5);
  const [humidity, setHumidity] = useState(48);
  const [lightOn, setLightOn] = useState(true);
  const [fanMode, setFanMode] = useState('Auto');

  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchSensorData = async () => {
    try {
      const response = await api.get('/sensors');
      if (response && response.sensors) {
        setTemp(response.sensors.temperature || 24.5);
        setHumidity(response.sensors.humidity || 48);
      }
    } catch (err) {
      console.log('Error fetching sensor data:', err);
    }
  };

  const toggleLight = async () => {
    try {
      await api.post('/devices/light', { state: !lightOn });
      setLightOn(!lightOn);
    } catch (err) {
      Alert.alert('Error', 'Failed to toggle light');
    }
  };

  const cycleFanMode = async () => {
    const modes = ['Off', 'Eco', 'Auto'];
    const currentIndex = modes.indexOf(fanMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    try {
      await api.post('/devices/fan', { mode: nextMode });
      setFanMode(nextMode);
    } catch (err) {
      Alert.alert('Error', 'Failed to change fan mode');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with Logout Button */}
      <View style={styles.topHeader}>
        <Text style={styles.appTitle}>Tuyen Home</Text>
        <TouchableOpacity 
          style={styles.logoutIconBtn}
          onPress={onLogout}
        >
          <Text style={styles.logoutIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Greeting Header */}
        <Text style={styles.greeting}>Good Afternoon</Text>
        <Text style={styles.dateTime}>Thursday, October 24, 2024 • 2:45 PM</Text>

        {/* System Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.statusBadge}>🛡️ System Secured</Text>
              <Text style={styles.statusDetail}>Privacy Shield Active</Text>
            </View>
            <View style={styles.statusBadgeActive}>
              <Text style={styles.statusBadgeActiveText}>ACTIVE</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusItemIcon}>🔐</Text>
              <Text style={styles.statusItemText}>Doors Locked</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusItemIcon}>📹</Text>
              <Text style={styles.statusItemText}>Cams Encrypted</Text>
            </View>
          </View>
        </View>

        {/* Temperature & Humidity */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.metricTemp]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>TEMPERATURE</Text>
              <View style={styles.metricDot} />
            </View>
            <Text style={styles.metricValue}>{temp.toFixed(1)}°C</Text>
            <View style={styles.miniChart} />
          </View>

          <View style={[styles.metricCard, styles.metricHum]}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>HUMIDITY</Text>
              <View style={styles.metricDot} />
            </View>
            <Text style={styles.metricValue}>{humidity}%</Text>
            <View style={styles.miniChart} />
          </View>
        </View>

        {/* Motion Detection */}
        <View style={styles.motionCard}>
          <View style={styles.motionIcon}>
            <Text style={styles.motionIconText}>📡</Text>
          </View>
          <View style={styles.motionInfo}>
            <Text style={styles.motionLabel}>LIVING ROOM MOTION</Text>
            <Text style={styles.motionValue}>No movement detected</Text>
            <Text style={styles.motionTime}>LAST 2M AGO</Text>
          </View>
        </View>

        {/* Controls Section */}
        <Text style={styles.controlsTitle}>Controls</Text>

        {/* Light Control */}
        <View style={styles.controlCard}>
          <View style={styles.controlHeader}>
            <View style={styles.controlIcon}>
              <Text style={styles.controlIconText}>💡</Text>
            </View>
            <View>
              <Text style={styles.controlName}>Security Light</Text>
              <Text style={styles.controlStatus}>BRIGHTNESS</Text>
            </View>
          </View>
          <View style={styles.lightnessSlider}>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: '80%' }]} />
            </View>
            <Text style={styles.sliderLabel}>80%</Text>
          </View>
          <TouchableOpacity 
            style={styles.lightToggle}
            onPress={toggleLight}
          >
            <View style={[styles.toggleSwitch, lightOn && styles.toggleOn]} />
          </TouchableOpacity>
        </View>

        {/* Fan Control */}
        <View style={styles.controlCard}>
          <View style={styles.controlHeader}>
            <View style={styles.controlIcon}>
              <Text style={styles.controlIconText}>🌀</Text>
            </View>
            <View>
              <Text style={styles.controlName}>Ceiling Fan</Text>
              <Text style={styles.controlStatus}>Mode: {fanMode} • Eco</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.fanControl}
            onPress={cycleFanMode}
          >
            <Text style={styles.fanValue}>3</Text>
            <TouchableOpacity style={styles.fanButton}>
              <Text style={styles.fanButtonText}>+</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Command Log */}
        <View style={styles.logSection}>
          <View style={styles.logHeader}>
            <Text style={styles.logTitle}>Command Log</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllLink}>VIEW ALL</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.logCard}>
            <Text style={styles.logTime}>[14:44:12]</Text>
            <View style={styles.logContent}>
              <Text style={styles.logTopic}>TOPIC:</Text>
              <Text style={styles.logValue}>/home/security/light</Text>
            </View>
            <Text style={styles.logPayload}>PAYLOAD: ON;</Text>
          </View>

          <View style={styles.logCard}>
            <Text style={styles.logTime}>[14:42:05]</Text>
            <View style={styles.logContent}>
              <Text style={styles.logTopic}>TOPIC:</Text>
              <Text style={styles.logValue}>/home/climate/temp</Text>
            </View>
            <Text style={styles.logPayload}>PAYLOAD: 24.5C</Text>
          </View>

          <View style={styles.logCard}>
            <Text style={styles.logTime}>[14:38:59]</Text>
            <View style={styles.logContent}>
              <Text style={styles.logTopic}>TOPIC:</Text>
              <Text style={styles.logValue}>/home/auth/node_3</Text>
            </View>
            <Text style={styles.logPayload}>PAYLOAD: ACK_HANDSHAKE</Text>
          </View>
        </View>

        {/* Floating Action Button Placeholder */}
        <View style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  logoutIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 20,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 60,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  statusBadge: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
    marginBottom: 4,
  },
  statusDetail: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  statusBadgeActive: {
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeActiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statusItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
  },
  statusItemIcon: {
    fontSize: 18,
  },
  statusItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricTemp: {
    backgroundColor: colors.surface,
  },
  metricHum: {
    backgroundColor: colors.surface,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  miniChart: {
    height: 40,
    backgroundColor: colors.background,
    borderRadius: 6,
  },
  motionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  motionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  motionIconText: {
    fontSize: 24,
  },
  motionInfo: {
    flex: 1,
  },
  motionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  motionValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  motionTime: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  controlsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  controlCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  controlIconText: {
    fontSize: 24,
  },
  controlName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  controlStatus: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  lightnessSlider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 12,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  sliderLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    width: 35,
    textAlign: 'right',
  },
  lightToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleOn: {
    marginLeft: 'auto',
  },
  fanControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fanValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  fanButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fanButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  logSection: {
    marginTop: 24,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAllLink: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '700',
  },
  logCard: {
    backgroundColor: '#2A2620',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    paddingVertical: 10,
  },
  logTime: {
    fontSize: 11,
    color: colors.success,
    fontFamily: 'monospace',
    fontWeight: '600',
    marginBottom: 6,
  },
  logContent: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  logTopic: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '700',
    marginRight: 6,
  },
  logValue: {
    fontSize: 11,
    color: colors.success,
  },
  logPayload: {
    fontSize: 11,
    color: colors.success,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  headerContainer: {
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  controlsGrid: {
    marginTop: 8,
  },
}); 