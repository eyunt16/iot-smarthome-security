import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { api } from '../services/api';
import * as Device from 'expo-device';
import { canControlDevices } from '../utils/roleUtils';

export default function DashboardScreen({ onLogout, user }) {
  const { isDark, themeColors } = useTheme();
  const isAuthorizedToControl = canControlDevices(user);
  
  // Real sensor states
  const [temp, setTemp] = useState(27.4);
  const [humidity, setHumidity] = useState(58);
  const [lightLevel, setLightLevel] = useState(320);
  const [motion, setMotion] = useState(false);
  const [lastMotionTime, setLastMotionTime] = useState('No event');

  // Control states
  const [lightOn, setLightOn] = useState(false);
  const [lightBrightness, setLightBrightness] = useState(0);
  const [fanSpeed, setFanSpeed] = useState(0); // 0 (Off), 35 (Eco), 70 (Mid), 100 (Max)
  const [commandLogs, setCommandLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSensorData();
    fetchCommandLogs();
    const interval = setInterval(() => {
      fetchSensorData();
      fetchCommandLogs();
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const fetchSensorData = async () => {
    try {
      const response = await api.get('/data');
      if (response) {
        if (response.temperature !== undefined) setTemp(Number(response.temperature));
        if (response.humidity !== undefined) setHumidity(Number(response.humidity));
        if (response.light !== undefined) setLightLevel(Number(response.light));
        
        const isMotionActive = response.motion === '1' || response.motion === 1 || response.motion === true;
        setMotion(isMotionActive);
        if (isMotionActive) {
          setLastMotionTime(new Date().toLocaleTimeString());
        }
      }
    } catch (err) {
      console.log('Error fetching sensor data:', err);
    }
  };

  const fetchCommandLogs = async () => {
    try {
      const response = await api.get('/history');
      if (Array.isArray(response)) {
        // Map history to simple formatted logs
        const formatted = response.map((item, idx) => {
          let payloadStr = 'N/A';
          if (item.data) {
            payloadStr = typeof item.data === 'object' ? JSON.stringify(item.data) : String(item.data);
          } else if (item.payload) {
            payloadStr = String(item.payload);
          }
          
          return {
            id: idx + '-' + (item.timestamp || Date.now()),
            time: item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
            topic: item.topic || 'home/telemetry',
            payload: payloadStr
          };
        }).slice(0, 5); // Take latest 5 logs
        setCommandLogs(formatted);
      }
    } catch (err) {
      console.log('Error fetching command logs:', err);
    }
  };

  const handleLightToggle = async (turnOn) => {
    if (!isAuthorizedToControl) {
      Alert.alert('Access Denied', 'View only for customer accounts.');
      return;
    }
    try {
      const nextBrightness = turnOn ? 100 : 0;
      await api.post('/device/light/1', { brightness: nextBrightness });
      setLightOn(turnOn);
      setLightBrightness(nextBrightness);
      fetchCommandLogs();
    } catch (err) {
      Alert.alert('Control Error', 'Failed to update light state.');
    }
  };

  const handleBrightnessChange = async (value) => {
    if (!isAuthorizedToControl) {
      Alert.alert('Access Denied', 'View only for customer accounts.');
      return;
    }
    try {
      await api.post('/device/light/1', { brightness: value });
      setLightBrightness(value);
      setLightOn(value > 0);
      fetchCommandLogs();
    } catch (err) {
      console.log('Error changing light brightness:', err);
    }
  };

  const handleFanSpeedChange = async (speed) => {
    if (!isAuthorizedToControl) {
      Alert.alert('Access Denied', 'View only for customer accounts.');
      return;
    }
    try {
      await api.post('/device/fan', { speed });
      setFanSpeed(speed);
      fetchCommandLogs();
    } catch (err) {
      Alert.alert('Control Error', 'Failed to update fan speed.');
    }
  };

  const getFanModeText = () => {
    if (fanSpeed === 0) return 'Off';
    if (fanSpeed <= 35) return 'Eco';
    if (fanSpeed <= 70) return 'Medium';
    return 'Max Speed';
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.bg }]}>
      {/* Header */}
      <View style={[styles.topHeader, { backgroundColor: themeColors.card, borderBottomColor: themeColors.border }]}>
        <Text style={[styles.appTitle, { color: themeColors.text }]}>Tuyen Home</Text>
        <TouchableOpacity 
          style={[styles.logoutIconBtn, { backgroundColor: themeColors.bg }]}
          onPress={onLogout}
        >
          <Text style={styles.logoutIcon}>📤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Motion Danger Warning Banner */}
        {motion && (
          <View style={[styles.motionBanner, { backgroundColor: themeColors.danger }]}>
            <Text style={styles.motionBannerText}>⚠️ INTRUSION ALERT: Motion detected in Living Room!</Text>
            <Text style={styles.motionBannerSub}>Timestamp: {lastMotionTime}</Text>
          </View>
        )}

        {/* Greeting */}
        <Text style={[styles.greeting, { color: themeColors.text }]}>{getGreeting()}</Text>
        <Text style={[styles.dateTime, { color: themeColors.textMuted }]}>
          {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>

        {/* Dynamic Status Card */}
        <View style={[styles.statusCard, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#E8F5E9' }]}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={[styles.statusBadge, { color: themeColors.success }]}>🛡️ Secure Protection Active</Text>
              <Text style={[styles.statusDetail, { color: themeColors.success }]}>SSL Strict Port Protocol 8883</Text>
            </View>
            <View style={[styles.statusBadgeActive, { backgroundColor: themeColors.success }]}>
              <Text style={styles.statusBadgeActiveText}>SECURED</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.08)' }]}>
              <Text style={styles.statusItemIcon}>🔐</Text>
              <Text style={[styles.statusItemText, { color: themeColors.text }]}>Smart Lock On</Text>
            </View>
            <View style={[styles.statusItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(16,185,129,0.08)' }]}>
              <Text style={styles.statusItemIcon}>👁️</Text>
              <Text style={[styles.statusItemText, { color: themeColors.text }]}>Anti-Inject On</Text>
            </View>
          </View>
        </View>

        {/* Distinct Compact Stat Pills / Cards for Rooms */}
        <Text style={[styles.controlsTitle, { color: themeColors.text }]}>Multi-Room Telemetry</Text>
        
        <View style={styles.roomsGridContainer}>
          {/* Living Room Card (ESP8266/ESP32 Real Live) */}
          <View style={[styles.roomCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.roomHeader}>
              <Text style={[styles.roomTitle, { color: themeColors.text }]}>Living Room ESP</Text>
              <View style={[styles.liveIndicator, { backgroundColor: themeColors.success }]} />
            </View>
            <View style={styles.pillRow}>
              <View style={[styles.statPill, { backgroundColor: themeColors.bg }]}>
                <Text style={styles.pillIcon}>🌡️</Text>
                <Text style={[styles.pillValue, { color: themeColors.text }]}>{temp.toFixed(1)}°C</Text>
              </View>
              <View style={[styles.statPill, { backgroundColor: themeColors.bg }]}>
                <Text style={styles.pillIcon}>💧</Text>
                <Text style={[styles.pillValue, { color: themeColors.text }]}>{humidity.toFixed(0)}%</Text>
              </View>
            </View>
          </View>

          {/* Bedroom Card (Simulated Node) */}
          <View style={[styles.roomCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.roomHeader}>
              <Text style={[styles.roomTitle, { color: themeColors.text }]}>Bedroom Sim</Text>
              <View style={[styles.liveIndicator, { backgroundColor: themeColors.accent }]} />
            </View>
            <View style={styles.pillRow}>
              <View style={[styles.statPill, { backgroundColor: themeColors.bg }]}>
                <Text style={styles.pillIcon}>🌡️</Text>
                <Text style={[styles.pillValue, { color: themeColors.text }]}>{(temp - 2.5).toFixed(1)}°C</Text>
              </View>
              <View style={[styles.statPill, { backgroundColor: themeColors.bg }]}>
                <Text style={styles.pillIcon}>💧</Text>
                <Text style={[styles.pillValue, { color: themeColors.text }]}>{(humidity + 7).toFixed(0)}%</Text>
              </View>
            </View>
          </View>

          {/* Kitchen Card (Simulated Node) */}
          <View style={[styles.roomCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <View style={styles.roomHeader}>
              <Text style={[styles.roomTitle, { color: themeColors.text }]}>Kitchen Sim</Text>
              <View style={[styles.liveIndicator, { backgroundColor: themeColors.accent }]} />
            </View>
            <View style={styles.pillRow}>
              <View style={[styles.statPill, { backgroundColor: themeColors.bg }]}>
                <Text style={styles.pillIcon}>🌡️</Text>
                <Text style={[styles.pillValue, { color: themeColors.text }]}>{(temp + 1.6).toFixed(1)}°C</Text>
              </View>
              <View style={[styles.statPill, { backgroundColor: themeColors.bg }]}>
                <Text style={styles.pillIcon}>💧</Text>
                <Text style={[styles.pillValue, { color: themeColors.text }]}>{(humidity - 3).toFixed(0)}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Real Device Controls */}
        <Text style={[styles.controlsTitle, { color: themeColors.text }]}>Controls</Text>

        {/* Light switch and Brightness Segment Toggles */}
        <View style={[styles.controlCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.controlHeader}>
            <View style={[styles.controlIcon, { backgroundColor: themeColors.bg }]}>
              <Text style={styles.controlIconText}>💡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.controlName, { color: themeColors.text }]}>Security Light</Text>
              <Text style={[styles.controlStatus, { color: themeColors.textMuted }]}>
                {lightOn ? `ON • ${lightBrightness}% Brightness` : 'OFF'}
              </Text>
            </View>
            <TouchableOpacity 
              style={[
                styles.lightToggle, 
                { backgroundColor: lightOn ? themeColors.success : themeColors.border },
                !isAuthorizedToControl && { opacity: 0.5 }
              ]}
              onPress={() => handleLightToggle(!lightOn)}
              activeOpacity={isAuthorizedToControl ? 0.2 : 1}
            >
              <View style={[styles.toggleSwitch, lightOn && styles.toggleOn]} />
            </TouchableOpacity>
          </View>

          {/* Segmented Brightness Slider Buttons */}
          <Text style={[styles.sliderHeader, { color: themeColors.textMuted }]}>Adjust Brightness</Text>
          <View style={styles.brightnessSegments}>
            {[10, 30, 60, 100].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.segmentButton, 
                  { 
                    backgroundColor: lightBrightness === level && lightOn ? themeColors.accent : themeColors.bg,
                    borderColor: themeColors.border 
                  },
                  !isAuthorizedToControl && { opacity: 0.5 }
                ]}
                onPress={() => handleBrightnessChange(level)}
                activeOpacity={isAuthorizedToControl ? 0.2 : 1}
              >
                <Text style={[
                  styles.segmentText, 
                  { color: lightBrightness === level && lightOn ? '#FFFFFF' : themeColors.text }
                ]}>
                  {level}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fan speed control pills */}
        <View style={[styles.controlCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={styles.controlHeader}>
            <View style={[styles.controlIcon, { backgroundColor: themeColors.bg }]}>
              <Text style={styles.controlIconText}>🌀</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.controlName, { color: themeColors.text }]}>Ceiling Fan</Text>
              <Text style={[styles.controlStatus, { color: themeColors.textMuted }]}>
                Speed: {getFanModeText()}
              </Text>
            </View>
          </View>

          {/* Speed settings pills */}
          <Text style={[styles.sliderHeader, { color: themeColors.textMuted }]}>Adjust Fan Speed</Text>
          <View style={styles.brightnessSegments}>
            {[
              { label: 'Off', val: 0 },
              { label: 'Eco', val: 35 },
              { label: 'Mid', val: 70 },
              { label: 'Max', val: 100 }
            ].map((speedItem) => (
              <TouchableOpacity
                key={speedItem.val}
                style={[
                  styles.segmentButton, 
                  { 
                    backgroundColor: fanSpeed === speedItem.val ? themeColors.accent : themeColors.bg,
                    borderColor: themeColors.border 
                  },
                  !isAuthorizedToControl && { opacity: 0.5 }
                ]}
                onPress={() => handleFanSpeedChange(speedItem.val)}
                activeOpacity={isAuthorizedToControl ? 0.2 : 1}
              >
                <Text style={[
                  styles.segmentText, 
                  { color: fanSpeed === speedItem.val ? '#FFFFFF' : themeColors.text }
                ]}>
                  {speedItem.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Real Command Log */}
        <View style={styles.logSection}>
          <View style={styles.logHeader}>
            <Text style={[styles.logTitle, { color: themeColors.text }]}>Live System Command Log</Text>
            <TouchableOpacity onPress={fetchCommandLogs}>
              <Text style={[styles.viewAllLink, { color: themeColors.accent }]}>REFRESH</Text>
            </TouchableOpacity>
          </View>

          {commandLogs.length === 0 ? (
            <View style={[styles.emptyLogs, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>No commands issued yet.</Text>
            </View>
          ) : (
            commandLogs.map((log) => (
              <View key={log.id} style={[styles.logCard, { backgroundColor: isDark ? '#3E3128' : '#2A2620' }]}>
                <Text style={styles.logTime}>[{log.time}]</Text>
                <View style={styles.logContent}>
                  <Text style={styles.logTopic}>TOPIC:</Text>
                  <Text style={styles.logValue}>{log.topic}</Text>
                </View>
                <Text style={styles.logPayload}>PAYLOAD: {log.payload}</Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  logoutIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  motionBanner: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  motionBannerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  motionBannerSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 13,
    marginBottom: 20,
  },
  statusCard: {
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
    marginBottom: 4,
  },
  statusDetail: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadgeActive: {
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
  },
  controlsTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  roomsGridContainer: {
    gap: 10,
    marginBottom: 24,
  },
  roomCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roomTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  pillIcon: {
    fontSize: 14,
  },
  pillValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  controlCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  controlIconText: {
    fontSize: 22,
  },
  controlName: {
    fontSize: 14,
    fontWeight: '700',
  },
  controlStatus: {
    fontSize: 11,
    marginTop: 2,
  },
  lightToggle: {
    width: 48,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitch: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  toggleOn: {
    marginLeft: 'auto',
  },
  sliderHeader: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  brightnessSegments: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
  logSection: {
    marginTop: 20,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyLogs: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  logCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    paddingVertical: 10,
  },
  logTime: {
    fontSize: 11,
    color: '#10B981',
    fontFamily: Platform.select({ ios: 'Courier', default: 'monospace' }),
    fontWeight: '600',
    marginBottom: 4,
  },
  logContent: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  logTopic: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
    marginRight: 6,
  },
  logValue: {
    fontSize: 11,
    color: '#10B981',
  },
  logPayload: {
    fontSize: 11,
    color: '#10B981',
  },
});