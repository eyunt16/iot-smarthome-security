import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { colors } from '../theme/colors';
import { api } from '../services/api';

const NODE_META = [
  { key: 'livingroom', label: 'Living Room ESP', color: '#C27B4A', source: 'ESP' },
  { key: 'bedroom', label: 'Bedroom ESP', color: '#4A7A9B', source: 'ESP' },
  { key: 'kitchen', label: 'Kitchen ESP', color: '#16A393', source: 'ESP' },
  { key: 'hallway', label: 'Hallway Sim', color: '#9C6ADE', source: 'Simulated' },
  { key: 'garage', label: 'Garage Sim', color: '#D14F70', source: 'Simulated' },
  { key: 'perimeter', label: 'Perimeter Sim', color: '#4D7C0F', source: 'Simulated' },
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

function buildBaseSnapshot(temp = 27.5, humidity = 58, lux = 320) {
  return {
    livingroom: { temperature: temp, humidity, lux },
    bedroom: { temperature: temp - 2.7, humidity: humidity - 5, lux: Math.max(120, lux - 110) },
    kitchen: { temperature: temp + 3.1, humidity: humidity + 9, lux: lux + 95 },
    hallway: { temperature: temp - 0.9, humidity: humidity - 2, lux: lux - 35 },
    garage: { temperature: temp + 1.6, humidity: humidity + 3, lux: lux + 55 },
    perimeter: { temperature: temp - 1.3, humidity: humidity + 5, lux: lux - 85 },
  };
}

function buildSeedSeries(snapshot, length = 24) {
  return Array.from({ length }, (_, index) => {
    const point = { time: index };
    NODE_META.forEach((node, nodeIndex) => {
      const base = snapshot[node.key].temperature;
      const wave = Math.sin(index * 0.58 + nodeIndex * 0.85) * 1.35;
      const ripple = Math.cos(index * 0.26 + nodeIndex) * 0.52;
      point[node.key] = +(base + wave + ripple).toFixed(1);
    });
    return point;
  });
}

function MetricCard({ label, value, tone }) {
  return (
    <View style={[styles.metricCard, { borderColor: `${tone}33` }]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <View style={[styles.metricBarTrack, { backgroundColor: `${tone}18` }]}>
        <View style={[styles.metricBarFill, { backgroundColor: tone }]} />
      </View>
    </View>
  );
}

function MiniBars({ values, color }) {
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const spread = Math.max(1, maxValue - minValue);

  return (
    <View style={styles.sparklineWrap}>
      {values.map((value, index) => {
        const normalized = ((value - minValue) / spread) * 0.72 + 0.18;
        return (
          <View
            key={`${index}-${value}`}
            style={[
              styles.sparkBar,
              {
                height: `${normalized * 100}%`,
                backgroundColor: color,
                opacity: 0.32 + (index / values.length) * 0.68,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export default function EnvironmentScreen() {
  const [snapshot, setSnapshot] = useState(() => buildBaseSnapshot());
  const [history, setHistory] = useState(() => buildSeedSeries(buildBaseSnapshot()));
  const [modeLabel, setModeLabel] = useState('Live ESP + Simulated');
  const tickRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    const fetchEnvironmentData = async () => {
      try {
        const response = await api.get('/sensors');
        if (!mounted || !response?.sensors) {
          return;
        }

        const nextTemp = Number.parseFloat(response.sensors.temperature) || 27.5;
        const nextHumidity = Number.parseFloat(response.sensors.humidity) || 58;
        const nextLux = Number.parseFloat(response.sensors.lux ?? response.sensors.light) || 320;

        setSnapshot((previous) => ({
          ...previous,
          ...buildBaseSnapshot(nextTemp, nextHumidity, nextLux),
        }));
        setModeLabel('Live ESP + Simulated');
      } catch (error) {
        if (mounted) {
          setModeLabel('Simulated Mesh Only');
        }
      }
    };

    fetchEnvironmentData();
    const pollTimer = setInterval(fetchEnvironmentData, 8000);

    return () => {
      mounted = false;
      clearInterval(pollTimer);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      tickRef.current += 1;

      setSnapshot((previous) => {
        const next = {};

        NODE_META.forEach((node, index) => {
          const currentNode = previous[node.key];
          const tempWave = Math.sin(tickRef.current * 0.78 + index * 0.72) * 0.78;
          const humWave = Math.cos(tickRef.current * 0.42 + index * 0.6) * 1.8;
          const luxWave = Math.sin(tickRef.current * 0.64 + index * 0.93) * 26;

          next[node.key] = {
            temperature: +clamp(currentNode.temperature + tempWave * 0.32, 18, 40).toFixed(1),
            humidity: Math.round(clamp(currentNode.humidity + humWave * 0.24, 35, 90)),
            lux: Math.round(clamp(currentNode.lux + luxWave * 0.22, 40, 900)),
          };
        });

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setHistory((previous) => {
      const nextPoint = { time: previous.length };
      NODE_META.forEach((node, index) => {
        const base = snapshot[node.key].temperature;
        const wave = Math.sin((tickRef.current + 1) * 0.78 + index * 0.72) * 1.42;
        const ripple = Math.cos((tickRef.current + 1) * 0.36 + index * 0.55) * 0.48;
        nextPoint[node.key] = +(base + wave + ripple).toFixed(1);
      });

      return [...previous, nextPoint].slice(-28);
    });
  }, [snapshot]);

  const averageTemperature = useMemo(() => (
    NODE_META.slice(0, 3).reduce((sum, node) => sum + snapshot[node.key].temperature, 0) / 3
  ), [snapshot]);

  const averageHumidity = useMemo(() => (
    NODE_META.slice(0, 3).reduce((sum, node) => sum + snapshot[node.key].humidity, 0) / 3
  ), [snapshot]);

  const averageLux = useMemo(() => (
    NODE_META.slice(0, 3).reduce((sum, node) => sum + snapshot[node.key].lux, 0) / 3
  ), [snapshot]);

  const trendDelta = history.length > 1
    ? history[history.length - 1].livingroom - history[Math.max(0, history.length - 6)].livingroom
    : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Environment Monitor</Text>
          <Text style={styles.headerSubtitle}>Hybrid telemetry mesh mirrored from the web dashboard</Text>
        </View>

        <View style={styles.badgeRow}>
          <View style={[styles.badge, styles.badgePrimary]}>
            <Text style={styles.badgeTextPrimary}>{modeLabel}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3 live rooms</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>6 visible nodes</Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard label="Average Temp" value={formatTemp(averageTemperature)} tone="#C27B4A" />
          <MetricCard label="Average Humidity" value={formatHum(averageHumidity)} tone="#4A7A9B" />
          <MetricCard label="Ambient Light" value={formatLux(averageLux)} tone="#D4A574" />
        </View>

        <View style={styles.trendCard}>
          <View style={styles.trendHeader}>
            <View>
              <Text style={styles.trendTitle}>Temperature Trends</Text>
              <Text style={styles.trendSubtitle}>Dense 6-node mesh with visible up/down movement</Text>
            </View>
            <View style={styles.trendBadge}>
              <Text style={styles.trendValue}>{trendDelta >= 0 ? '+' : ''}{trendDelta.toFixed(1)}°</Text>
              <Text style={styles.trendLabel}>LAST 5 TICKS</Text>
            </View>
          </View>

          <View style={styles.legendWrap}>
            {NODE_META.map((node) => (
              <View key={node.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: node.color }]} />
                <Text style={styles.legendLabel}>{node.label}</Text>
              </View>
            ))}
          </View>

          <MiniBars
            values={history.slice(-24).map((point) => point.livingroom)}
            color="#C27B4A"
          />
        </View>

        <View style={styles.nodeSection}>
          <Text style={styles.sectionTitle}>Node Mesh</Text>
          {NODE_META.map((node, index) => (
            <View key={node.key} style={styles.nodeCard}>
              <View style={styles.nodeHeader}>
                <View>
                  <Text style={styles.nodeSource}>{index < 3 ? 'LIVE ESP' : 'SIMULATED'}</Text>
                  <Text style={styles.nodeTitle}>{node.label}</Text>
                </View>
                <View style={[styles.nodeSignalBadge, { backgroundColor: `${node.color}18` }]}>
                  <Text style={[styles.nodeSignalText, { color: node.color }]}>{92 - index * 5}%</Text>
                </View>
              </View>

              <View style={styles.nodeMetrics}>
                <View style={styles.nodeMetricCell}>
                  <Text style={styles.nodeMetricLabel}>Temp</Text>
                  <Text style={styles.nodeMetricValue}>{formatTemp(snapshot[node.key].temperature)}</Text>
                </View>
                <View style={styles.nodeMetricCell}>
                  <Text style={styles.nodeMetricLabel}>Humidity</Text>
                  <Text style={styles.nodeMetricValue}>{formatHum(snapshot[node.key].humidity)}</Text>
                </View>
                <View style={styles.nodeMetricCell}>
                  <Text style={styles.nodeMetricLabel}>Light</Text>
                  <Text style={styles.nodeMetricValue}>{formatLux(snapshot[node.key].lux)}</Text>
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 80,
  },
  header: {
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgePrimary: {
    backgroundColor: 'rgba(26,77,46,0.08)',
    borderColor: 'rgba(26,77,46,0.18)',
  },
  badgeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  badgeTextPrimary: {
    color: '#1A4D2E',
    fontSize: 12,
    fontWeight: '700',
  },
  metricsGrid: {
    gap: 12,
    marginBottom: 22,
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  metricValue: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  metricBarTrack: {
    marginTop: 14,
    height: 8,
    borderRadius: 999,
  },
  metricBarFill: {
    width: '72%',
    height: '100%',
    borderRadius: 999,
  },
  trendCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 22,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  trendTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  trendSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  trendBadge: {
    alignItems: 'flex-end',
  },
  trendValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.accent,
  },
  trendLabel: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  legendWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  sparklineWrap: {
    height: 160,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 3,
    backgroundColor: '#F8F6F0',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  sparkBar: {
    flex: 1,
    borderRadius: 999,
    minHeight: 14,
  },
  nodeSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  nodeCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  nodeSource: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
  nodeTitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  nodeSignalBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  nodeSignalText: {
    fontSize: 12,
    fontWeight: '700',
  },
  nodeMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  nodeMetricCell: {
    flex: 1,
    minWidth: 92,
  },
  nodeMetricLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.textMuted,
    fontWeight: '700',
  },
  nodeMetricValue: {
    marginTop: 6,
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
});
