/**
 * EnvironmentView.jsx — Full-page real-time sensor charts
 * Uses Recharts AreaChart w/ animated rolling data window
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Thermometer, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, ReferenceLine,
} from '../lib/recharts-shim.js';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Leaf } from 'lucide-react';
import { useTheme } from '../contexts/DarkModeContext';

// ── Recharts custom tooltip ────────────────────────────────────
function CustomTooltip({ active, payload, label, unit, isDark, colors }) {
  if (!active || !payload?.length) return null;
  return (
    <div 
      className="rounded-2xl border px-4 py-3 shadow-lg transition-colors duration-300"
      style={{
        borderColor: colors.border,
        backgroundColor: isDark ? colors.card : '#FFFFFF',
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider mb-1 transition-colors duration-300" style={{ color: colors.textSecondary }}>{label}</p>
      <p className="font-display text-xl font-bold transition-colors duration-300" style={{ color: colors.text }}>
        {payload[0].value}{unit}
      </p>
    </div>
  );
}

// ── Full Trend Chart ──────────────────────────────────────────
function TrendChart({ data, color, gradId, unit, refValue, label }) {
  const { isDark, colors } = useTheme();
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const latest = values[values.length - 1] ?? 0;
  const prev    = values[values.length - 2] ?? latest;
  const delta   = (latest - prev).toFixed(1);
  const trend   = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

  return (
    <div 
      className="rounded-3xl border p-7 transition-colors duration-300"
      style={{
        borderColor: colors.border,
        backgroundColor: isDark ? colors.card : '#FFFFFF',
        boxShadow: isDark 
          ? '0 4px 12px rgba(0, 0, 0, 0.1)'
          : '0 4px 20px rgba(155,124,84,0.07)'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1 transition-colors duration-300" style={{ color: colors.textSecondary }}>{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl font-bold transition-colors duration-300" style={{ color: colors.text }}>{latest}</span>
            <span className="text-xl font-medium transition-colors duration-300" style={{ color: colors.textSecondary }}>{unit}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            {trend === 'up'   && <TrendingUp   size={14} className="text-red-400" />}
            {trend === 'down' && <TrendingDown size={14} className="text-green-500" />}
            {trend === 'flat' && <Minus        size={14} style={{ color: colors.textSecondary }} />}
            <span className={`text-[12px] font-semibold transition-colors duration-300`} style={{
              color: trend === 'up' ? '#ff6b6b' : trend === 'down' ? '#51cf66' : colors.textSecondary
            }}>
              {delta > 0 ? '+' : ''}{delta}{unit} from last reading
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-wider transition-colors duration-300" style={{ color: colors.textSecondary }}>24-pt window</p>
          <p className="text-[11px] font-semibold mt-1 transition-colors duration-300" style={{ color: colors.textSecondary }}>
            H: <span style={{ color }}>{max}{unit}</span>
            {'  '}
            L: <span style={{ color }}>{min}{unit}</span>
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 4 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.22} />
                <stop offset="95%" stopColor={color} stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid 
              vertical={false} 
              stroke={isDark ? 'rgba(102, 100, 95, 0.1)' : 'rgba(144,116,74,0.07)'} 
            />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: colors.textSecondary }}
              tickLine={false} axisLine={false}
              interval={Math.floor(data.length / 5)}
            />
            <YAxis
              tick={{ fontSize: 10, fill: colors.textSecondary }}
              tickLine={false} axisLine={false}
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            {refValue != null && (
              <ReferenceLine
                y={refValue} stroke={color} strokeDasharray="4 3"
                strokeOpacity={0.5}
                label={{ value: `Target ${refValue}${unit}`, fontSize: 9, fill: color, position: 'insideTopRight' }}
              />
            )}
            <Tooltip content={<CustomTooltip unit={unit} isDark={isDark} colors={colors} />} />
            <Area
              type="monotone" dataKey="value"
              stroke={color} strokeWidth={2.5}
              fill={`url(#${gradId})`}
              dot={false}
              isAnimationActive={true} animationDuration={500}
              activeDot={{ r: 5, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
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
        boxShadow: isDark 
          ? '0 2px 8px rgba(0, 0, 0, 0.1)'
          : '0 2px 8px rgba(155,124,84,0.05)'
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

  const tempValues = temperature.history.map(d => d.value);
  const humValues  = humidity.history.map(d => d.value);

  return (
    <motion.div
      className="space-y-8 px-8 py-8 pb-10 transition-colors duration-300"
      style={{ backgroundColor: isDark ? colors.bg : '#F8F6F0' }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >

      {/* Overview stat pills */}
      <section>
        <SectionHeader icon={Leaf} title="Environment Overview" subtitle="Real-time DHT11 sensor data via MQTT · Rolling 24-point window" />
        <div className="flex flex-wrap gap-3 mb-0">
          <StatPill label="Current Temp"    value={`${temperature.current} °C`} />
          <StatPill label="Current Humidity" value={`${humidity.current} %`}    />
          <StatPill label="Temp (min/max)"  value={`${Math.min(...tempValues).toFixed(1)} / ${Math.max(...tempValues).toFixed(1)} °C`} />
          <StatPill label="Humidity (min/max)" value={`${Math.min(...humValues)} / ${Math.max(...humValues)} %`} />
        </div>
      </section>

      {/* Temperature Chart */}
      <section>
        <SectionHeader icon={Thermometer} title="Temperature Trend" />
        <TrendChart
          data={temperature.history}
          color="#c27b4a"
          gradId="grad-temp"
          unit="°C"
          refValue={26}
          label="TEMPERATURE · DHT11"
        />
      </section>

      {/* Humidity Chart + Error Card */}
      <section>
        <SectionHeader icon={Droplets} title="Humidity Trend" />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_auto]">
          <TrendChart
            data={humidity.history}
            color="#4a7a9b"
            gradId="grad-hum"
            unit="%"
            refValue={60}
            label="HUMIDITY · DHT11"
          />

          {/* Error state demo card */}
          <div 
            className="xl:w-[300px] rounded-3xl border p-6 self-start relative overflow-hidden transition-colors duration-300"
            style={{
              borderColor: isDark ? colors.border : '#d5ccc0',
              backgroundColor: isDark ? `${colors.card}99` : '#f5f2ee'
            }}
          >
            {/* Diagonal stripe overlay */}
            <div
              className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.05]"
              style={{
                backgroundImage: isDark 
                  ? 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 1px, transparent 0, transparent 50%)'
                  : 'repeating-linear-gradient(-45deg,#6b6560 0,#6b6560 1px,transparent 0,transparent 50%)',
                backgroundSize: '8px 8px',
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <div className="grid h-7 w-7 place-items-center rounded-xl bg-amber-100">
                  <Droplets size={13} className="text-amber-500" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider transition-colors duration-300" style={{ color: colors.textSecondary }}>
                  Humidity · DHT11
                </span>
                <span className="ml-auto rounded-full border border-amber-300/70 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                  Sensor Offline
                </span>
              </div>
              <p className="font-display text-4xl font-bold mb-3 transition-colors duration-300" style={{ color: isDark ? `${colors.text}40` : '#2c2015'}} >-- %</p>
              <div className="rounded-2xl border border-amber-200/60 px-4 py-3 transition-colors duration-300" style={{
                backgroundColor: isDark ? 'rgba(217, 119, 6, 0.1)' : 'rgba(217, 119, 6, 0.1)',
              }}>
                <p className="text-[11px] leading-relaxed text-amber-700">
                  <strong>Error State Demo:</strong> This card intentionally renders in offline mode to showcase the UI's tamper-detection and error-handling capabilities. In production, this state activates when the{' '}
                  <code className="rounded px-1 font-mono text-[10px]" style={{ backgroundColor: isDark ? 'rgba(217, 119, 6, 0.2)' : 'rgba(217, 119, 6, 0.15)' }}>home/humidity</code>{' '}
                  topic goes silent for &gt; 30 s.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
