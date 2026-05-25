import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Leaf, SunMedium, Cpu, Radio } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '../lib/recharts-shim.js';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useTheme } from '../contexts/DarkModeContext';

const BASE_NODE_CONFIG = {
  livingroom: { label: 'Living Room ESP', color: '#c27b4a', source: 'ESP' },
  bedroom: { label: 'Bedroom ESP', color: '#4a7a9b', source: 'ESP' },
  kitchen: { label: 'Kitchen ESP', color: '#16a393', source: 'ESP' },
};

const VIRTUAL_NODE_CONFIG = {
  hallway: { label: 'Hallway Sim', color: '#9c6ade', source: 'Simulated' },
  garage: { label: 'Garage Sim', color: '#d14f70', source: 'Simulated' },
  perimeter: { label: 'Perimeter Sim', color: '#4d7c0f', source: 'Simulated' },
};

const NODE_CONFIG = {
  ...BASE_NODE_CONFIG,
  ...VIRTUAL_NODE_CONFIG,
};

const NODE_KEYS = Object.keys(NODE_CONFIG);

function getMetric(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatTemperature(value) {
  const metric = getMetric(value);
  return metric === null ? '-- °C' : `${metric.toFixed(1)} °C`;
}

function formatHumidity(value) {
  const metric = getMetric(value);
  return metric === null ? '-- %' : `${Math.round(metric)} %`;
}

function formatLux(value) {
  const metric = getMetric(value);
  return metric === null ? '-- lux' : `${Math.round(metric)} lux`;
}

function average(values, fallback = null) {
  const validValues = values.filter((value) => value !== null);
  if (validValues.length === 0) {
    return fallback;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

function createSnapshot(sensorData) {
  const livingroom = {
    temperature: getMetric(sensorData?.livingroom?.temperature) ?? 27.5,
    humidity: getMetric(sensorData?.livingroom?.humidity) ?? 60,
    lux: getMetric(sensorData?.livingroom?.lux) ?? 320,
  };
  const bedroom = {
    temperature: getMetric(sensorData?.bedroom?.temperature) ?? 24.0,
    humidity: getMetric(sensorData?.bedroom?.humidity) ?? 55,
    lux: getMetric(sensorData?.bedroom?.lux) ?? 180,
  };
  const kitchen = {
    temperature: getMetric(sensorData?.kitchen?.temperature) ?? 31.2,
    humidity: getMetric(sensorData?.kitchen?.humidity) ?? 70,
    lux: getMetric(sensorData?.kitchen?.lux) ?? 420,
  };

  const hallwayBaseTemp = average([livingroom.temperature, bedroom.temperature], 25.8);
  const hallwayBaseHum = average([livingroom.humidity, bedroom.humidity], 57);
  const hallwayBaseLux = average([livingroom.lux, bedroom.lux], 250);
  const garageBaseTemp = average([kitchen.temperature, livingroom.temperature], 28.4);
  const garageBaseHum = average([kitchen.humidity, livingroom.humidity], 63);
  const garageBaseLux = average([kitchen.lux, livingroom.lux], 360);
  const perimeterBaseTemp = average([livingroom.temperature, bedroom.temperature, kitchen.temperature], 27.3);
  const perimeterBaseHum = average([livingroom.humidity, bedroom.humidity, kitchen.humidity], 61);
  const perimeterBaseLux = average([livingroom.lux, bedroom.lux, kitchen.lux], 300);

  return {
    livingroom,
    bedroom,
    kitchen,
    hallway: {
      temperature: +(hallwayBaseTemp + 0.6).toFixed(1),
      humidity: Math.round(hallwayBaseHum + 1),
      lux: Math.round(hallwayBaseLux * 0.85),
    },
    garage: {
      temperature: +(garageBaseTemp + 1.3).toFixed(1),
      humidity: Math.round(garageBaseHum - 2),
      lux: Math.round(garageBaseLux * 0.92),
    },
    perimeter: {
      temperature: +(perimeterBaseTemp - 0.8).toFixed(1),
      humidity: Math.round(perimeterBaseHum + 3),
      lux: Math.round(perimeterBaseLux * 0.75),
    },
  };
}

function buildSeedHistory(snapshot, length = 42) {
  const now = Date.now();

  return Array.from({ length }, (_, index) => {
    const pointTime = new Date(now - (length - index) * 1000);
    const point = {
      time: pointTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };

    NODE_KEYS.forEach((key, seriesIndex) => {
      const baseTemp = snapshot[key]?.temperature ?? 26;
      const wave = Math.sin((index + 1) * 0.55 + seriesIndex * 0.8) * 1.45;
      const ripple = Math.cos((index + 1) * 0.31 + seriesIndex) * 0.55;
      point[key] = +(baseTemp + wave + ripple).toFixed(1);
    });

    return point;
  });
}

function deriveNodeCardData(snapshot, telemetryMeta) {
  const espRooms = new Set(telemetryMeta?.activeEspRooms || []);

  return NODE_KEYS.map((key, index) => {
    const node = snapshot[key];
    const isEsp = BASE_NODE_CONFIG[key] !== undefined;
    const isLive = isEsp && espRooms.has(key);
    const signal = isEsp ? (isLive ? 96 - index * 4 : 72 - index * 3) : 88 - index * 5;
    const battery = isEsp ? 93 - index * 6 : 100;

    return {
      key,
      label: NODE_CONFIG[key].label,
      source: isLive ? 'Live ESP' : NODE_CONFIG[key].source,
      color: NODE_CONFIG[key].color,
      temperature: node.temperature,
      humidity: node.humidity,
      lux: node.lux,
      signal: clamp(signal, 42, 99),
      battery: clamp(battery, 58, 100),
    };
  });
}

function StatusBadge({ label, color, textColor }) {
  return (
    <div
      className="rounded-full border px-3 py-1 text-[11px] font-bold tracking-wide"
      style={{ backgroundColor: color, color: textColor, borderColor: `${textColor}22` }}
    >
      {label}
    </div>
  );
}

function StatPill({ label, value, tone = '#A67B5B' }) {
  const { isDark, colors } = useTheme();

  return (
    <div
      className="min-w-[145px] flex-1 rounded-2xl border px-4 py-3 transition-colors duration-300"
      style={{
        borderColor: colors.border,
        backgroundColor: isDark ? colors.card : '#FFFFFF',
        boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(155,124,84,0.05)',
      }}
    >
      <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
        {label}
      </p>
      <p className="mt-1 font-display text-lg font-bold" style={{ color: colors.text }}>
        {value}
      </p>
      <div className="mt-3 h-1.5 rounded-full" style={{ backgroundColor: `${tone}22` }}>
        <div className="h-full rounded-full" style={{ width: '72%', backgroundColor: tone }} />
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  const { isDark, colors } = useTheme();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className="rounded-2xl border px-4 py-3 shadow-lg"
      style={{ backgroundColor: isDark ? colors.card : '#ffffff', borderColor: colors.border }}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
        {label}
      </p>
      {payload.slice(0, 6).map((entry) => (
        <div key={entry.dataKey} className="mt-1 flex items-center gap-2 text-sm">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span style={{ color: colors.textSecondary }}>{NODE_CONFIG[entry.dataKey]?.label}:</span>
          <span className="font-display text-base font-bold" style={{ color: colors.text }}>
            {entry.value}°C
          </span>
        </div>
      ))}
    </div>
  );
}

export default function EnvironmentView({ sensorData, telemetryMeta }) {
  const { isDark, colors } = useTheme();
  const [chartHistory, setChartHistory] = useState([]);
  const sensorDataRef = useRef(sensorData);
  const tickRef = useRef(0);

  useEffect(() => {
    sensorDataRef.current = sensorData;
  }, [sensorData]);

  const snapshot = useMemo(() => createSnapshot(sensorData), [sensorData]);
  const nodeCards = useMemo(() => deriveNodeCardData(snapshot, telemetryMeta), [snapshot, telemetryMeta]);

  useEffect(() => {
    if (chartHistory.length > 0) {
      return;
    }

    setChartHistory(buildSeedHistory(snapshot));
  }, [chartHistory.length, snapshot]);

  useEffect(() => {
    const interval = setInterval(() => {
      tickRef.current += 1;
      const currentSnapshot = createSnapshot(sensorDataRef.current);

      const point = {
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };

      NODE_KEYS.forEach((key, index) => {
        const base = currentSnapshot[key]?.temperature ?? 26;
        const wave = Math.sin(tickRef.current * 0.8 + index * 0.9) * 1.6;
        const ripple = Math.cos(tickRef.current * 0.43 + index * 0.6) * 0.65;
        point[key] = +(base + wave + ripple).toFixed(1);
      });

      setChartHistory((prev) => [...prev, point].slice(-60));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const humidityValues = nodeCards.slice(0, 3).map((node) => getMetric(node.humidity)).filter((value) => value !== null);
  const luxValues = nodeCards.slice(0, 3).map((node) => getMetric(node.lux)).filter((value) => value !== null);
  const averageTemperature = average(nodeCards.map((node) => getMetric(node.temperature)), 0);
  const averageHumidity = average(humidityValues, 0);
  const averageLux = average(luxValues, 0);
  const activeEspRooms = telemetryMeta?.activeEspRooms || [];

  return (
    <motion.div
      className="space-y-8 px-5 py-6 pb-10 transition-colors duration-300 md:px-8 md:py-8"
      style={{ backgroundColor: isDark ? colors.bg : '#F8F6F0' }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <section className="space-y-5">
        <div className="flex flex-col gap-4 rounded-[28px] border p-5 md:p-6" style={{
          borderColor: colors.border,
          background: isDark
            ? 'linear-gradient(135deg, rgba(96,77,63,0.96), rgba(62,49,40,0.96))'
            : 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(247,241,231,0.96))',
          boxShadow: isDark ? '0 10px 24px rgba(0,0,0,0.14)' : '0 12px 28px rgba(155,124,84,0.08)',
        }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <SectionHeader icon={Leaf} title="Environment Overview" subtitle="Hybrid telemetry mesh for smart-home security" />
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                label={telemetryMeta?.modeLabel || 'Simulated Mesh Only'}
                color={isDark ? 'rgba(200,170,118,0.14)' : 'rgba(26,77,46,0.08)'}
                textColor={isDark ? '#EADDCA' : '#1A4D2E'}
              />
              <StatusBadge
                label={`${telemetryMeta?.espNodeCount || 0} live ESP`}
                color="rgba(15,118,110,0.10)"
                textColor="#0f766e"
              />
              <StatusBadge
                label={`${telemetryMeta?.simulatedNodeCount || 0} simulated`}
                color="rgba(147,51,234,0.10)"
                textColor="#7c3aed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <StatPill label="Average Temp" value={formatTemperature(averageTemperature)} tone="#C27B4A" />
            <StatPill label="Average Humidity" value={formatHumidity(averageHumidity)} tone="#4A7A9B" />
            <StatPill label="Ambient Light" value={formatLux(averageLux)} tone="#D4A574" />
            <StatPill label="Visible Nodes" value={`${telemetryMeta?.totalVisibleNodes || nodeCards.length} nodes`} tone="#16a393" />
            <StatPill label="ESP Rooms Active" value={activeEspRooms.length ? activeEspRooms.join(', ') : 'fallback mode'} tone="#9c6ade" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader icon={Cpu} title="Node Mesh" subtitle="Physical and simulated telemetry nodes rendered together" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {nodeCards.map((node) => (
            <div
              key={node.key}
              className="rounded-[24px] border p-5 transition-colors duration-300"
              style={{
                borderColor: colors.border,
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.08)' : '0 4px 18px rgba(155,124,84,0.06)',
              }}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: colors.textSecondary }}>
                    {node.source}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-bold" style={{ color: colors.text }}>
                    {node.label}
                  </h3>
                </div>
                <div className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ backgroundColor: `${node.color}18`, color: node.color }}>
                  {node.signal}% signal
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textSecondary }}>Temp</p>
                  <p className="mt-1 text-lg font-bold" style={{ color: colors.text }}>{formatTemperature(node.temperature)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textSecondary }}>Humidity</p>
                  <p className="mt-1 text-lg font-bold" style={{ color: colors.text }}>{formatHumidity(node.humidity)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: colors.textSecondary }}>Light</p>
                  <p className="mt-1 text-lg font-bold" style={{ color: colors.text }}>{formatLux(node.lux)}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-[11px] font-semibold" style={{ color: colors.textSecondary }}>
                  <span>Battery / mesh health</span>
                  <span>{node.battery}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: `${node.color}18` }}>
                  <div className="h-full rounded-full" style={{ width: `${node.battery}%`, backgroundColor: node.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader icon={Thermometer} title="Temperature Trends" subtitle="Dense 6-node waveform with hybrid live/simulated motion" />
        <div
          className="rounded-3xl border p-4 transition-colors duration-300 md:p-7"
          style={{
            borderColor: colors.border,
            backgroundColor: isDark ? colors.card : '#FFFFFF',
            boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.1)' : '0 4px 20px rgba(155,124,84,0.07)',
          }}
        >
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[12px] font-semibold" style={{ color: colors.textSecondary }}>
            <div className="flex items-center gap-2 rounded-full px-3 py-1" style={{ backgroundColor: isDark ? 'rgba(234,221,202,0.08)' : 'rgba(26,77,46,0.06)' }}>
              <Radio size={14} />
              <span>1-second refresh</span>
            </div>
            <div className="flex items-center gap-2 rounded-full px-3 py-1" style={{ backgroundColor: 'rgba(212,165,116,0.10)' }}>
              <SunMedium size={14} />
              <span>Ambient lux blended into mesh telemetry</span>
            </div>
          </div>

          <div className="h-[360px] w-full md:h-[420px]">
            {chartHistory.length === 0 ? (
              <div className="grid h-full place-items-center text-sm font-medium" style={{ color: colors.textSecondary }}>
                Syncing real-time sensor data...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartHistory} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                  <defs>
                    {NODE_KEYS.map((key) => (
                      <linearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={NODE_CONFIG[key].color} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={NODE_CONFIG[key].color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>

                  <CartesianGrid vertical={false} stroke={isDark ? 'rgba(102, 100, 95, 0.1)' : 'rgba(144,116,74,0.07)'} />

                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: colors.textSecondary }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={22}
                  />

                  <YAxis
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tick={{ fontSize: 10, fill: colors.textSecondary }}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ paddingTop: 18, fontSize: '12px', color: colors.textSecondary }}
                  />

                  {NODE_KEYS.map((key) => {
                    const config = NODE_CONFIG[key];
                    return (
                      <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={config.color}
                        strokeWidth={BASE_NODE_CONFIG[key] ? 2.6 : 1.8}
                        fill={`url(#grad-${key})`}
                        fillOpacity={BASE_NODE_CONFIG[key] ? 1 : 0.35}
                        dot={false}
                        activeDot={{ r: 4.5, fill: config.color, strokeWidth: 0 }}
                        name={config.label}
                      />
                    );
                  })}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
