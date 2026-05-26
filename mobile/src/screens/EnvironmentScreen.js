import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { api } from '../services/api';
import { LineChart } from 'react-native-chart-kit';

const NODE_META = [
  { key: 'livingroom', label: 'Living Room ESP', color: '#C27B4A', source: 'ESP' },
  { key: 'bedroom', label: 'Bedroom Sim', color: '#4A7A9B', source: 'Simulated' },
  { key: 'kitchen', label: 'Kitchen Sim', color: '#16A393', source: 'Simulated' },
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatTemp(value) {
  return `${Number(value).toFixed(1)}°C`;
}

function formatHum(value) {
  return `${Math.round(value)}%`;
}

function formatLux(value) {
  return `${Math.round(value)} lux`;
}

export default function EnvironmentScreen() {
  const { isDark, themeColors } = useTheme();

  // Snapshot states
  const [snapshot, setSnapshot] = useState({
    livingroom: { temperature: 27.4, humidity: 58, lux: 320 },
    bedroom: { temperature: 24.9, humidity: 65, lux: 210 },
    kitchen: { temperature: 29.0, humidity: 55, lux: 415 },
  });

  const [historyPoints, setHistoryPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modeLabel, setModeLabel] = useState('Live ESP + Simulated');

  useEffect(() => {
    fetchLatestSensors();
    fetchHistoryData();
    const interval = setInterval(() => {
      fetchLatestSensors();
      fetchHistoryData();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchLatestSensors = async () => {
    try {
      const response = await api.get('/data');
      if (response) {
        const nextTemp = Number(response.temperature) || 27.4;
        const nextHumidity = Number(response.humidity) || 58;
        const nextLux = Number(response.light) || 320;

        setSnapshot({
          livingroom: { temperature: nextTemp, humidity: nextHumidity, lux: nextLux },
          bedroom: { temperature: nextTemp - 2.5, humidity: nextHumidity + 7, lux: Math.max(120, nextLux - 110) },
          kitchen: { temperature: nextTemp + 1.6, humidity: nextHumidity - 3, lux: nextLux + 95 },
        });
        setModeLabel('Live ESP + Simulated');
      }
    } catch (err) {
      setModeLabel('Simulated Mesh Only');
    }
  };

  const fetchHistoryData = async () => {
    try {
      const response = await api.get('/history');
      if (Array.isArray(response) && response.length > 0) {
        // Parse historical sensor values
        const parsed = response.map((item, idx) => {
          let tempVal = 27.4;
          if (item.data && item.data.temperature !== undefined) {
            tempVal = Number(item.data.temperature);
          } else if (item.payload) {
            try {
              const obj = JSON.parse(item.payload);
              tempVal = Number(obj.temperature) || 27.4;
            } catch (e) {
              tempVal = Number(item.payload) || 27.4;
            }
          }
          return {
            time: idx,
            livingroom: tempVal,
            bedroom: tempVal - 2.5,
            kitchen: tempVal + 1.6
          };
        }).reverse().slice(-6); // Take latest 6 history points for clean chart labels
        
        if (parsed.length >= 2) {
          setHistoryPoints(parsed);
          return;
        }
      }
      generateFallbackHistory();
    } catch (err) {
      generateFallbackHistory();
    }
  };

  const generateFallbackHistory = () => {
    // Generate beautiful waves for backup display
    const backup = [];
    const baseTemp = snapshot.livingroom.temperature;
    for (let i = 5; i >= 0; i--) {
      const offset = Math.sin(i * 0.9) * 1.1;
      backup.push({
        time: 5 - i,
        livingroom: +(baseTemp + offset).toFixed(1),
        bedroom: +(baseTemp - 2.5 + offset * 0.8).toFixed(1),
        kitchen: +(baseTemp + 1.6 + offset * 1.2).toFixed(1)
      });
    }
    setHistoryPoints(backup);
  };

  const averageTemperature = useMemo(() => {
    return (snapshot.livingroom.temperature + snapshot.bedroom.temperature + snapshot.kitchen.temperature) / 3;
  }, [snapshot]);

  const averageHumidity = useMemo(() => {
    return (snapshot.livingroom.humidity + snapshot.bedroom.humidity + snapshot.kitchen.humidity) / 3;
  }, [snapshot]);

  const averageLux = useMemo(() => {
    return (snapshot.livingroom.lux + snapshot.bedroom.lux + snapshot.kitchen.lux) / 3;
  }, [snapshot]);

  // Construct chart data structure
  const chartData = useMemo(() => {
    if (historyPoints.length === 0) return null;
    
    return {
      labels: historyPoints.map((_, i) => `${i + 1}h`),
      datasets: [
        {
          data: historyPoints.map(p => p.livingroom),
          color: (opacity = 1) => `rgba(194, 123, 74, ${opacity})`, // Living Room - Orange
          strokeWidth: 3
        },
        {
          data: historyPoints.map(p => p.bedroom),
          color: (opacity = 1) => `rgba(74, 122, 155, ${opacity})`, // Bedroom - Blue
          strokeWidth: 3
        },
        {
          data: historyPoints.map(p => p.kitchen),
          color: (opacity = 1) => `rgba(22, 163, 147, ${opacity})`, // Kitchen - Green
          strokeWidth: 3
        }
      ],
      legend: ['Living Room', 'Bedroom', 'Kitchen']
    };
  }, [historyPoints]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Environment Monitor</Text>
          <Text style={[styles.headerSubtitle, { color: themeColors.textMuted }]}>
            Microcontroller telemetry mesh mirrored from local host broker
          </Text>
        </View>

        {/* Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF', borderColor: themeColors.border }]}>
            <Text style={[styles.badgeText, { color: themeColors.text }]}>{modeLabel}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF', borderColor: themeColors.border }]}>
            <Text style={[styles.badgeText, { color: themeColors.text }]}>3 nodes active</Text>
          </View>
        </View>

        {/* Average Metrics Cards */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.metricLabel, { color: themeColors.textMuted }]}>Average Temp</Text>
            <Text style={[styles.metricValue, { color: themeColors.text }]}>{formatTemp(averageTemperature)}</Text>
            <View style={[styles.progressBarTrack, { backgroundColor: themeColors.bg }]}>
              <View style={[styles.progressBarFill, { width: `${(averageTemperature / 45) * 100}%`, backgroundColor: '#C27B4A' }]} />
            </View>
          </View>

          <View style={[styles.metricCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.metricLabel, { color: themeColors.textMuted }]}>Average Humidity</Text>
            <Text style={[styles.metricValue, { color: themeColors.text }]}>{formatHum(averageHumidity)}</Text>
            <View style={[styles.progressBarTrack, { backgroundColor: themeColors.bg }]}>
              <View style={[styles.progressBarFill, { width: `${averageHumidity}%`, backgroundColor: '#4A7A9B' }]} />
            </View>
          </View>

          <View style={[styles.metricCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <Text style={[styles.metricLabel, { color: themeColors.textMuted }]}>Ambient Light</Text>
            <Text style={[styles.metricValue, { color: themeColors.text }]}>{formatLux(averageLux)}</Text>
            <View style={[styles.progressBarTrack, { backgroundColor: themeColors.bg }]}>
              <View style={[styles.progressBarFill, { width: `${(averageLux / 1000) * 100}%`, backgroundColor: '#16A393' }]} />
            </View>
          </View>
        </View>

        {/* Real Temperature Multi-line LineChart */}
        <View style={[styles.trendCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.trendTitle, { color: themeColors.text }]}>Temperature Trends</Text>
          <Text style={[styles.trendSubtitle, { color: themeColors.textMuted }]}>
            Comparative multi-room analytics curve
          </Text>

          {chartData ? (
            <View style={styles.chartWrapper}>
              <LineChart
                data={chartData}
                width={Dimensions.get('window').width - 76}
                height={200}
                chartConfig={{
                  backgroundGradientFrom: themeColors.card,
                  backgroundGradientTo: themeColors.card,
                  decimalPlaces: 1,
                  color: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity * 0.4})` : `rgba(0, 0, 0, ${opacity * 0.4})`,
                  labelColor: (opacity = 1) => themeColors.text,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: "4",
                    strokeWidth: "1",
                    stroke: themeColors.card
                  }
                }}
                bezier
                style={{
                  marginVertical: 12,
                  borderRadius: 16
                }}
              />
            </View>
          ) : (
            <ActivityIndicator size="small" color={themeColors.accent} style={{ marginVertical: 32 }} />
          )}

          {/* Color Indicators Legend */}
          <View style={styles.legendRow}>
            {NODE_META.map((node) => (
              <View key={node.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: node.color }]} />
                <Text style={[styles.legendLabel, { color: themeColors.text }]}>{node.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Telemetry Node List */}
        <View style={styles.nodeSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Node Signals</Text>
          {NODE_META.map((node, idx) => (
            <View key={node.key} style={[styles.nodeCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={styles.nodeHeader}>
                <View>
                  <Text style={[styles.nodeSource, { color: themeColors.textMuted }]}>{node.source}</Text>
                  <Text style={[styles.nodeTitle, { color: themeColors.text }]}>{node.label}</Text>
                </View>
                <View style={[styles.nodeSignalBadge, { backgroundColor: `${node.color}15` }]}>
                  <Text style={[styles.nodeSignalText, { color: node.color }]}>{98 - idx * 3}% Signal</Text>
                </View>
              </View>

              <View style={styles.nodeMetrics}>
                <View style={styles.nodeMetricCell}>
                  <Text style={[styles.nodeMetricLabel, { color: themeColors.textMuted }]}>Temp</Text>
                  <Text style={[styles.nodeMetricValue, { color: themeColors.text }]}>{formatTemp(snapshot[node.key].temperature)}</Text>
                </View>
                <View style={styles.nodeMetricCell}>
                  <Text style={[styles.nodeMetricLabel, { color: themeColors.textMuted }]}>Humidity</Text>
                  <Text style={[styles.nodeMetricValue, { color: themeColors.text }]}>{formatHum(snapshot[node.key].humidity)}</Text>
                </View>
                <View style={styles.nodeMetricCell}>
                  <Text style={[styles.nodeMetricLabel, { color: themeColors.textMuted }]}>Light</Text>
                  <Text style={[styles.nodeMetricValue, { color: themeColors.text }]}>{formatLux(snapshot[node.key].lux)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsGrid: {
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '700',
  },
  progressBarTrack: {
    marginTop: 10,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  trendCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 22,
  },
  trendTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  trendSubtitle: {
    marginTop: 2,
    fontSize: 12,
  },
  chartWrapper: {
    alignItems: 'center',
    marginVertical: 6,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nodeSection: {
    gap: 10,
  },
  nodeCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nodeSource: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nodeTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  nodeSignalBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  nodeSignalText: {
    fontSize: 11,
    fontWeight: '700',
  },
  nodeMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  nodeMetricCell: {
    flex: 1,
  },
  nodeMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  nodeMetricValue: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
});
