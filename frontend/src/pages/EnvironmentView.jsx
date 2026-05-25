/**
 * EnvironmentView.jsx — Full-page real-time sensor charts
 * Merged Multi-line AreaChart with original UI
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Thermometer, Leaf } from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer,
  Tooltip, XAxis, YAxis
} from '../lib/recharts-shim.js';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useTheme } from '../contexts/DarkModeContext';

// ── Cấu hình màu cho từng Sensor ──────────────────────────────
const SENSOR_CONFIG = {
  temperature: { label: 'Temperature', color: '#c27b4a' },
  humidity: { label: 'Humidity', color: '#4a7a9b' },
  light: { label: 'Light', color: '#e7eb5c' },
  motion: { label: 'Motion', color: '#16a393' },

};

// ── Hàm xử lý Data gộp chung trục thời gian ───────────────────
function formatTimeLabel(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return String(value);
}

function buildChartData(sensorData) {
  const metrics = Object.keys(SENSOR_CONFIG).filter(
    (key) => Array.isArray(sensorData?.[key]?.history) && sensorData[key].history.length > 0
  );

  if (metrics.length === 0) return { chartData: [], metrics: [] };

  const maxLength = Math.max(...metrics.map((key) => sensorData[key].history.length));

  const chartData = Array.from({ length: maxLength }, (_, index) => {
    const row = {};
    metrics.forEach((key) => {
      const point = sensorData[key].history[index];
      if (!point) return;
      row.time = point.time || point.timestamp || row.time || `${index + 1}`;
      row[key] = typeof point.value === 'boolean' ? Number(point.value) : Number.parseFloat(point.value);
    });
    return row;
  }).filter((row) => row.time);

  return { chartData, metrics };
}

// ── Recharts custom tooltip (Multi-line) ──────────────────────
function CustomTooltip({ active, payload, label }) {
  const { isDark, colors } = useTheme();

  if (!active || !payload?.length) return null;

  return (
    <div
      className="rounded-2xl border px-4 py-3 shadow-lg"
      style={{
        backgroundColor: isDark ? colors.card : '#ffffff',
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
        {formatTimeLabel(label)}
      </p>

      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm mt-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span style={{ color: colors.textSecondary }}>{SENSOR_CONFIG[entry.dataKey]?.label || entry.dataKey}:</span>
          <span className="font-display font-bold text-lg">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Stat Pill ─────────────────────────────────────────────────
function StatPill({ label, value }) {
  const { isDark, colors } = useTheme();
  return (
    <div 
      className="rounded-2xl border px-4 py-3 transition-colors duration-300"
      style={{
        borderColor: colors.border,
        backgroundColor: isDark ? colors.card : '#FFFFFF',
        boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(155,124,84,0.05)'
      }}
    >
      <p className="text-[9px] font-bold uppercase tracking-wider transition-colors duration-300" style={{ color: colors.textSecondary }}>{label}</p>
      <p className="font-display text-lg font-bold mt-0.5 transition-colors duration-300" style={{ color: colors.text }}>{value}</p>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────
export default function EnvironmentView({ sensorData }) {
  const { isDark, colors } = useTheme();
  const { temperature, humidity } = sensorData;

  // Lấy data cho StatPills
  const tempValues = temperature?.history?.map(d => d.value) || [0];
  const humValues  = humidity?.history?.map(d => d.value) || [0];

  // Lấy data đã gộp cho Chart
  const { chartData, metrics } = buildChartData(sensorData);

  return (
    <motion.div
      className="space-y-8 px-8 py-8 pb-10 transition-colors duration-300"
      style={{ backgroundColor: isDark ? colors.bg : '#F8F6F0' }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >

      {/* Overview stat pills (Giữ nguyên giao diện cũ của bạn) */}
      <section>
        <SectionHeader icon={Leaf} title="Environment Overview" subtitle="Real-time multi-sensor data via MQTT" />
        <div className="flex flex-wrap gap-3 mb-0">
          <StatPill label="Current Temp"    value={`${temperature?.current || 0} °C`} />
          <StatPill label="Current Humidity" value={`${humidity?.current || 0} %`}    />
          <StatPill label="Temp (min/max)"  value={`${Math.min(...tempValues).toFixed(1)} / ${Math.max(...tempValues).toFixed(1)} °C`} />
          <StatPill label="Humidity (min/max)" value={`${Math.min(...humValues)} / ${Math.max(...humValues)} %`} />
        </div>
      </section>

      {/* Biểu đồ Multi-line gộp */}
      <section>
        <SectionHeader icon={Thermometer} title="Combined Sensor Trend" />
        
        <div 
          className="rounded-3xl border p-7 transition-colors duration-300"
          style={{
            borderColor: colors.border,
            backgroundColor: isDark ? colors.card : '#FFFFFF',
            boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.1)' : '0 4px 20px rgba(155,124,84,0.07)'
          }}
        >
          <div className="h-[340px] w-full">
            {chartData.length === 0 ? (
              <div className="grid h-full place-items-center text-sm" style={{ color: colors.textSecondary }}>
                Waiting for sensor data...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
                  <defs>
                    {metrics.map(key => (
                      <linearGradient key={`grad-${key}`} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={SENSOR_CONFIG[key].color} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={SENSOR_CONFIG[key].color} stopOpacity={0}    />
                      </linearGradient>
                    ))}
                  </defs>
                  
                  <CartesianGrid vertical={false} stroke={isDark ? 'rgba(102, 100, 95, 0.1)' : 'rgba(144,116,74,0.07)'} />
                  
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={formatTimeLabel}
                    tick={{ fontSize: 10, fill: colors.textSecondary }} 
                    tickLine={false} axisLine={false} 
                    interval="preserveStartEnd"
                  />
                  
                  <YAxis 
                    tick={{ fontSize: 10, fill: colors.textSecondary }} 
                    tickLine={false} axisLine={false} 
                  />
                  
                  <Tooltip content={<CustomTooltip />} />
                  
                  <Legend 
                    verticalAlign="bottom" align="center" iconType="circle"
                    wrapperStyle={{ paddingTop: 20, fontSize: '12px', color: colors.textSecondary }}
                  />

                  {metrics.map((key) => {
                    const config = SENSOR_CONFIG[key];
                    return (
                      <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        stroke={config.color}
                        strokeWidth={2.5}
                        fill={`url(#grad-${key})`}
                        dot={false}
                        activeDot={{ r: 5, fill: config.color, strokeWidth: 0 }}
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