/**
 * Dashboard.jsx — Smart Home Multi-Room Grid View
 *
 * Features:
 *   • Multi-room RoomCard grid layout (Living Room, Kitchen, Bedroom, Study)
 *   • Modern relay toggle switches (ON/OFF binary state)
 *   • Live sensor readings (Temperature, Humidity, Motion)
 *   • Security Intrusion Detection hero card
 *   • Locked Accounts management widget
 *   • MQTT Command Log
 *
 * Color Spec (Earth tones):
 *   Light: #F8F6F0 bg / #FFFFFF cards / #1A4D2E Forest Green accent / #B8860B Dark Amber
 *   Dark:  #352315 bg / #4A3221 cards / #FFFFFF text / #C8AA76 Muted Gold accent
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Eye,
  EyeOff,
  Fan,
  Lightbulb,
  Power,
  Radio,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Thermometer,
  Droplets,
  Zap,
  Terminal,
  Lock,
  LockOpen,
  Activity,
  UserX,
} from 'lucide-react';
import {
  Area, AreaChart, ResponsiveContainer, Tooltip,
  CartesianGrid, XAxis, YAxis, Legend // Thêm 4 component này
} from '../lib/recharts-shim.js';
import FanControl from '../components/FanControl';
import LightControl from '../components/LightControl';
import { useTheme } from '../contexts/DarkModeContext';
import { getLockedUsers, unlockUser } from '../services/api';

// ── Constants ────────────────────────────────────────────────
function sparkGradId(id) { return `sg-${id}`; }

// ── SectionHeader — inlined for guaranteed availability ───────
// Theme-aware: Forest Green (light) / Muted Gold (dark)
function SectionHeader({ icon: Icon, title, subtitle }) {
  const { isDark, colors } = useTheme();
  const accent    = isDark ? '#C8AA76' : '#1A4D2E';
  const iconBg    = isDark
    ? 'linear-gradient(135deg, rgba(200,170,118,0.22), rgba(200,170,118,0.08))'
    : 'linear-gradient(135deg, rgba(26,77,46,0.14), rgba(26,77,46,0.05))';

  return (
    <motion.div
      className="flex items-center gap-3 mb-6"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Icon badge */}
      <div
        className="grid h-9 w-9 shrink-0 place-items-center rounded-[14px] transition-all duration-300"
        style={{ background: iconBg }}
      >
        <Icon size={17} strokeWidth={2.2} style={{ color: accent }} />
      </div>

      {/* Text */}
      <div>
        <h2
          className="font-display text-xl font-bold leading-tight transition-colors duration-300"
          style={{ color: colors.text }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-[11px] mt-0.5 transition-colors duration-300"
            style={{ color: colors.textSecondary }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── Safe-access sentinels (used when MQTT data hasn't arrived yet) ──
const SAFE_SENSOR = {
  temperature: { current: '--', history: [] },
  humidity:    { current: '--', history: [] },
  light:       { current: '--', history: [] },
  motion:      { current: false, lastEvent: null, alertCount: 0 },
};

const SAFE_DEVICES = {
  light: { on: false, brightness: 0 },
  fan:   { on: false, speed: 0 },
};

// ── Skeleton Loader ───────────────────────────────────────────
function DashboardSkeleton() {
  const { isDark, colors } = useTheme();
  const accent = isDark ? '#C8AA76' : '#1A4D2E';

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-8 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Animated spinner ring */}
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span
          className="absolute inline-block h-16 w-16 rounded-full border-4 animate-spin"
          style={{ borderColor: `${accent}30`, borderTopColor: accent }}
        />
        <span
          className="h-8 w-8 rounded-full"
          style={{ backgroundColor: `${accent}18` }}
        />
      </div>

      <div className="text-center space-y-1">
        <p
          className="font-display text-xl font-bold transition-colors duration-300"
          style={{ color: colors.text }}
        >
          Connecting to ESP32…
        </p>
        <p
          className="text-sm transition-colors duration-300"
          style={{ color: colors.textSecondary }}
        >
          Awaiting first MQTT packet from HiveMQ Cloud
        </p>
      </div>

      {/* Skeleton cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {['Temperature', 'Humidity', 'Motion'].map((label) => (
          <div
            key={label}
            className="rounded-3xl border p-6 space-y-3 transition-all duration-300"
            style={{ borderColor: colors.border, backgroundColor: isDark ? colors.card : '#FFFFFF' }}
          >
            <div
              className="h-2.5 w-24 rounded-full animate-pulse"
              style={{ backgroundColor: `${accent}25` }}
            />
            <div
              className="h-8 w-16 rounded-xl animate-pulse"
              style={{ backgroundColor: `${accent}18` }}
            />
            <div
              className="h-2 w-full rounded-full animate-pulse"
              style={{ backgroundColor: `${accent}12` }}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Live Sensor Widget ────────────────────────────────────────
// Dark mode sparklines: muted gold (#C8AA76) stroke, fillOpacity 0.12
function LiveSensorWidget({
  icon: Icon, label, value, unit,
  accentLight = '#1A4D2E',   // forest green for light mode
  accentDark  = '#C8AA76',   // muted gold for dark mode
  history = [], glowDuration = '1.2s', animClass,
}) {
  const { isDark, colors, chartColors } = useTheme();
  const [flash, setFlash] = useState(false);
  const prevRef = useRef(value);
  const isMounted = useRef(false);

  // Accent & chart color based on mode
  const accent      = isDark ? accentDark  : accentLight;
  const strokeColor = isDark
    ? chartColors.primary          // muted gold in dark
    : accentLight;                 // specific accent in light

  useEffect(() => {
    if (!isMounted.current) { isMounted.current = true; return; }
    if (value !== prevRef.current) {
      prevRef.current = value;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), parseFloat(glowDuration) * 1000);
      return () => clearTimeout(t);
    }
  }, [value, glowDuration]);

  const gradId = sparkGradId(label.replace(/\s+/g, ''));
  const fillOp = chartColors.fillOpacity; // 0.12 dark / 0.25 light

  return (
    <motion.div
      className={`relative rounded-3xl border p-6 transition-all duration-300 ${flash ? animClass : ''} cursor-pointer card-hover`}
      style={{
        borderColor: colors.border,
        backgroundColor: isDark ? colors.card : '#FFFFFF',
        ...(flash ? {
          boxShadow: `0 4px 20px rgba(155,124,84,0.1), 0 0 0 5px ${accent}22`,
        } : {})
      }}
      whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.25 } }}
    >
      {/* Live indicator dot */}
      <div className="absolute top-4 right-4">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
            style={{ background: accent }} />
          <span className="relative inline-flex h-2 w-2 rounded-full"
            style={{ background: accent }} />
        </span>
      </div>

      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="grid h-8 w-8 place-items-center rounded-[12px]"
          style={{ background: `linear-gradient(135deg, ${accent}28, ${accent}10)` }}>
          <Icon size={16} style={{ color: accent }} strokeWidth={2.2} />
        </div>
        <span
          className="text-[10px] font-bold uppercase tracking-wider transition-colors duration-300"
          style={{ color: colors.textSecondary }}
        >
          {label}
        </span>
      </div>

      {/* Value — pulse-glow when MQTT updates */}
      <div className="flex items-baseline gap-1 mb-3">
        <span
          className={`font-display text-4xl font-bold transition-colors duration-300 ${flash ? 'animate-pulse-glow' : ''}`}
          style={{ color: colors.text }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-base font-medium transition-colors duration-300" style={{ color: colors.textSecondary }}>
            {unit}
          </span>
        )}
      </div>

      {/* Sparkline — harmonious dark mode colors */}
      {history.length > 0 && (
        <div className="h-12 w-full -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 2, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={strokeColor} stopOpacity={fillOp * 2} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0}           />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{
                  background:   chartColors.tooltipBg,
                  border:       `1px solid ${colors.border}`,
                  borderRadius: 10,
                  fontSize:     11,
                  color:        colors.text,
                  padding:      '6px 12px',
                  boxShadow:    isDark
                    ? '0 8px 24px rgba(0,0,0,0.35)'
                    : '0 4px 12px rgba(144,116,74,0.1)',
                }}
                formatter={(v) => [`${v}${unit}`, label]}
                labelFormatter={() => ''}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={isDark ? 1.5 : 2}
                fillOpacity={fillOp}
                fill={`url(#${gradId})`}
                dot={false}
                isAnimationActive={true}
                animationDuration={400}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

// ── Motion / Intrusion Card ───────────────────────────────────
function IntrusionCard({ motionDetected, lastEvent, alertCount }) {
  const { isDark, colors } = useTheme();

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 border transition-all duration-500 ${
        motionDetected
          ? 'border-red-900/30 shadow-[0_16px_48px_rgba(190,40,40,0.38)]'
          : 'border-transparent shadow-[0_16px_48px_rgba(28,25,23,0.15)]'
      }`}
      style={{
        backgroundColor: motionDetected
          ? (isDark ? '#2a1515' : '#3d1010')
          : (isDark ? '#3D2818' : '#1A3020'),
      }}
    >
      {/* Glow orb */}
      <div className={`pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full blur-3xl transition-all duration-700 ${
        motionDetected ? 'bg-red-600/20' : 'bg-slate-600/5'
      }`} />
      {motionDetected && (
        <div className="absolute inset-0 animate-pulse rounded-3xl border-2 border-red-500/20" />
      )}

      <div className="relative flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 mb-1">PIR Motion Sensor</p>
          <h3 className="font-display text-2xl font-bold text-white">Intrusion Detection</h3>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-2xl transition-all duration-300 ${
          motionDetected ? 'bg-red-500/25 text-red-300' : 'bg-white/10 text-amber-200'
        }`}>
          {motionDetected ? <ShieldAlert size={24} /> : <ShieldCheck size={24} />}
        </div>
      </div>

      <div className="relative flex items-center gap-3">
        <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all duration-300 ${
          motionDetected ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-200'
        }`}>
          {motionDetected ? <Eye size={15} /> : <EyeOff size={15} />}
          {motionDetected ? 'Motion Detected — ALERT' : 'No Activity — Secure'}
        </div>
        {alertCount > 0 && (
          <span className="rounded-full bg-red-500/20 px-2.5 py-1 text-[11px] font-bold text-red-300">
            {alertCount} alert{alertCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {lastEvent && (
        <p className="relative mt-2 text-[10px] text-white/30">Last event: {lastEvent}</p>
      )}
    </div>
  );
}

// ── MQTT Log ──────────────────────────────────────────────────
const LOG_STYLES = {
  receive: { dotColor: '#7BA8C7', textColor: '#4A7A9B',  bgLight: 'rgba(74,122,155,0.06)',  bgDark: 'rgba(74,122,155,0.15)',  borderLight: 'rgba(74,122,155,0.15)',  borderDark: 'rgba(74,122,155,0.25)'  },
  publish:  { dotColor: '#C8AA76', textColor: '#A68A64',  bgLight: 'rgba(166,138,100,0.08)', bgDark: 'rgba(200,170,118,0.15)', borderLight: 'rgba(166,138,100,0.2)', borderDark: 'rgba(200,170,118,0.25)' },
  system:   { dotColor: '#1A4D2E', textColor: '#2D6A42',  bgLight: 'rgba(26,77,46,0.06)',   bgDark: 'rgba(139,154,127,0.15)', borderLight: 'rgba(26,77,46,0.15)',   borderDark: 'rgba(139,154,127,0.25)' },
  alert:    { dotColor: '#DC3C32', textColor: '#DC3C32',  bgLight: 'rgba(220,60,50,0.07)',   bgDark: 'rgba(220,60,50,0.15)',   borderLight: 'rgba(220,60,50,0.15)',   borderDark: 'rgba(220,60,50,0.25)'   },
};

function CommandLog({ entries }) {
  const { isDark, colors } = useTheme();
  const visible = entries.slice(0, 8);

  return (
    <div
      className="rounded-3xl border p-6 transition-all duration-300"
      style={{
        borderColor: colors.border,
        backgroundColor: isDark ? colors.card : '#FFFFFF',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="grid h-8 w-8 place-items-center rounded-[12px] transition-colors duration-300"
          style={{
            background: isDark ? 'rgba(200,170,118,0.15)' : '#f2e4cc',
          }}
        >
          <Terminal size={15} style={{ color: colors.textSecondary }} />
        </div>
        <div>
          <p className="text-[13px] font-bold" style={{ color: colors.text }}>MQTT Command Log</p>
          <p className="text-[10px]" style={{ color: colors.textSecondary }}>Live broker traffic</p>
        </div>
      </div>

      <div className="space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-hidden">
        {visible.length === 0 && (
          <p className="text-center text-[12px] py-4 transition-colors duration-300" style={{ color: colors.textSecondary }}>
            Connecting…
          </p>
        )}
        {visible.map((entry) => {
          const s  = LOG_STYLES[entry.type] ?? LOG_STYLES.receive;
          const bg = isDark ? s.bgDark   : s.bgLight;
          const br = isDark ? s.borderDark : s.borderLight;
          return (
            <div
              key={entry.id}
              className="flex items-start gap-2.5 rounded-xl border px-3 py-2 transition-all duration-200 hover:scale-[1.01]"
              style={{ backgroundColor: bg, borderColor: br }}
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: s.dotColor }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] font-mono font-semibold truncate" style={{ color: isDark ? colors.text : s.textColor }}>
                    {entry.topic}
                  </span>
                  <span className="shrink-0 text-[9px]" style={{ color: colors.textSecondary }}>{entry.time}</span>
                </div>
                <p className="text-[10px]" style={{ color: colors.textSecondary }}>
                  {entry.payload}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── System Info Strip ─────────────────────────────────────────
function SystemStrip({ isConnected }) {
  const { isDark, colors } = useTheme();

  const okBg     = isDark ? 'rgba(200,170,118,0.15)' : 'rgba(26,77,46,0.1)';
  const okColor  = isDark ? '#C8AA76'                 : '#1A4D2E';
  const errBg    = 'rgba(220,60,50,0.12)';
  const errColor = '#DC3C32';

  const items = [
    { icon: Radio,        label: 'Broker',   value: 'HiveMQ Cloud',    ok: isConnected },
    { icon: Lock,         label: 'Protocol', value: 'MQTTS / TLS 1.3', ok: true        },
    { icon: Cpu,          label: 'MCU',      value: 'ESP32',           ok: true        },
    { icon: CheckCircle2, label: 'Uptime',   value: '99.2 %',          ok: true        },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ icon: Icon, label, value, ok }) => (
        <div
          key={label}
          className="flex items-center gap-2 rounded-2xl border px-3.5 py-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
          style={{
            borderColor: colors.border,
            backgroundColor: isDark ? colors.card : '#FFFFFF',
          }}
        >
          <div
            className="grid h-5 w-5 place-items-center rounded-lg transition-colors duration-300"
            style={{ backgroundColor: ok ? okBg : errBg }}
          >
            <Icon size={11} strokeWidth={2.2} style={{ color: ok ? okColor : errColor }} />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider transition-colors duration-300"
              style={{ color: colors.textSecondary }}>
              {label}
            </p>
            <p className="text-[11px] font-semibold transition-colors duration-300"
              style={{ color: colors.text }}>
              {value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function LockedAccountsWidget({
  lockedUsers,
  loadingLockedUsers,
  refreshingLockedUsers,
  unlockingUserId,
  lockedUsersError,
  unlockSuccessMessage,
  onRefresh,
  onUnlock,
}) {
  const { isDark, colors } = useTheme();

  if (!loadingLockedUsers && lockedUsers.length === 0 && !lockedUsersError) {
    return null;
  }

  return (
    <section className="animate-fade-slide-up delay-75">
      <SectionHeader
        icon={UserX}
        title="Locked Accounts Management"
        subtitle="SuperAdmin recovery actions for security-triggered account lockouts"
      />
      <div
        className="rounded-3xl border p-6 transition-all duration-300"
        style={{
          borderColor: colors.border,
          backgroundColor: isDark ? colors.card : '#FFFFFF',
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-5">
          <div>
            <p className="text-sm font-bold" style={{ color: colors.text }}>
              Locked account review
            </p>
            <p className="text-[11px]" style={{ color: colors.textSecondary }}>
              {loadingLockedUsers
                ? 'Checking current lockout status...'
                : `${lockedUsers.length} locked account${lockedUsers.length > 1 ? 's' : ''} currently need attention.`}
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loadingLockedUsers || refreshingLockedUsers}
            className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-[12px] font-bold transition-all duration-200 disabled:opacity-60"
            style={{
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FAF7F1',
            }}
          >
            <RefreshCw size={14} className={refreshingLockedUsers ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {lockedUsersError && (
          <div
            className="mb-4 rounded-2xl border px-4 py-3 text-sm font-medium"
            style={{
              borderColor: '#D98B8B',
              backgroundColor: 'rgba(220,60,50,0.08)',
              color: '#B55B5B',
            }}
          >
            {lockedUsersError}
          </div>
        )}

        {unlockSuccessMessage && (
          <div
            className="mb-4 rounded-2xl border px-4 py-3 text-sm font-medium"
            style={{
              borderColor: '#88C9A0',
              backgroundColor: 'rgba(100,200,140,0.10)',
              color: '#2F7A52',
            }}
          >
            {unlockSuccessMessage}
          </div>
        )}

        {loadingLockedUsers ? (
          <div className="flex min-h-[160px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm font-medium" style={{ color: colors.textSecondary }}>
              <RefreshCw size={16} className="animate-spin" />
              Loading locked accounts...
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: colors.border }}>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FAF7F1' }}>
                  <tr>
                    {['Username', 'Email', 'Failed Attempts', 'Action'].map((label) => (
                      <th
                        key={label}
                        className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: colors.textSecondary }}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lockedUsers.map((user, index) => (
                    <tr
                      key={user._id}
                      style={{
                        borderTop: `1px solid ${colors.border}`,
                        backgroundColor: index % 2 === 0
                          ? 'transparent'
                          : (isDark ? 'rgba(255,255,255,0.015)' : 'rgba(248,246,240,0.65)'),
                      }}
                    >
                      <td className="px-4 py-4 text-sm font-semibold" style={{ color: colors.text }}>
                        {user.username}
                      </td>
                      <td className="px-4 py-4 text-sm" style={{ color: colors.textSecondary }}>
                        {user.email}
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold" style={{ color: colors.text }}>
                        {user.failedLoginAttempts}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => onUnlock(user._id)}
                          disabled={unlockingUserId === user._id}
                          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-bold transition-all duration-200 disabled:opacity-60"
                          style={{
                            background: isDark
                              ? 'linear-gradient(135deg, rgba(200,170,118,0.22), rgba(200,170,118,0.12))'
                              : 'linear-gradient(135deg, #E8F2EC, #DDEEE4)',
                            color: isDark ? '#C8AA76' : '#1A4D2E',
                          }}
                        >
                          {unlockingUserId === user._id ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              Unlocking...
                            </>
                          ) : (
                            <>
                              <LockOpen size={13} />
                              Unlock
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


// ── MAIN DASHBOARD ────────────────────────────────────────────
export default function Dashboard({
  sensorData,
  deviceStates,
  commandLog,
  toggleDevice,
  isConnected,
  allRoomsData = {},
  canManageSystem = true,
  canControlDevices = true,
}) {
  const { isDark, colors, chartColors } = useTheme();
  const [lockedUsers, setLockedUsers] = useState([]);
  const [loadingLockedUsers, setLoadingLockedUsers] = useState(true);
  const [refreshingLockedUsers, setRefreshingLockedUsers] = useState(false);
  const [unlockingUserId, setUnlockingUserId] = useState('');
  const [lockedUsersError, setLockedUsersError] = useState('');
  const [unlockSuccessMessage, setUnlockSuccessMessage] = useState('');
  const [chartHistory, setChartHistory] = useState([]);

  // ── Defensive: fall back to safe sentinels if data hasn't arrived yet ──
  const safeData    = sensorData    ?? SAFE_SENSOR;
  const safeDevices = deviceStates  ?? SAFE_DEVICES;

  const { temperature, humidity, light: lightSensor, motion: pir } = safeData;  // renamed: avoids shadowing framer-motion's `motion`
  const { light, fan }                         = safeDevices;

  // Guard: show skeleton until at least temperature is a real number
  const hasData = typeof temperature?.current === 'number';

  // ── Historical Data Collection for Multi-Room Chart ──
  useEffect(() => {
    const interval = setInterval(() => {
      // Format current time as HH:mm:ss
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      // Extract current values from allRoomsData
      const livingRoomTemp = parseFloat(allRoomsData?.livingroom?.temperature) || 0;
      const livingRoomHumid = parseFloat(allRoomsData?.livingroom?.humidity) || 0;
      const bedroomTemp = parseFloat(allRoomsData?.bedroom?.temperature) || 0;
      const bedroomHumid = parseFloat(allRoomsData?.bedroom?.humidity) || 0;
      const kitchenTemp = parseFloat(allRoomsData?.kitchen?.temperature) || 0;
      const kitchenHumid = parseFloat(allRoomsData?.kitchen?.humidity) || 0;

      // Create new data point with timestamp
      const newDataPoint = {
        time: timeString,
        livingRoomTemp,
        livingRoomHumid,
        bedroomTemp,
        bedroomHumid,
        kitchenTemp,
        kitchenHumid,
      };

      // Add to history and keep only last 20 items
      setChartHistory((prev) => [...prev, newDataPoint].slice(-20));
    }, 5000);

    return () => clearInterval(interval);
  }, [allRoomsData]);

  useEffect(() => {
    const fetchLockedUsers = async () => {
      if (!canManageSystem) {
        setLockedUsers([]);
        setLoadingLockedUsers(false);
        return;
      }

      const token = localStorage.getItem('token');

      if (!token) {
        setLockedUsers([]);
        setLoadingLockedUsers(false);
        return;
      }

      setLoadingLockedUsers(true);
      setLockedUsersError('');

    try {
      const data = await getLockedUsers();
      setLockedUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (error) {
      setLockedUsersError(error.response?.data?.message || error.message || 'Unable to load locked accounts.');
      setLockedUsers([]);
    } finally {
      setLoadingLockedUsers(false);
      }
    };

    fetchLockedUsers();
  }, [canManageSystem]);

  const refreshLockedUsers = async () => {
    if (!canManageSystem) {
      setLockedUsers([]);
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setLockedUsers([]);
      return;
    }

    setRefreshingLockedUsers(true);
    setLockedUsersError('');

    try {
      const data = await getLockedUsers();
      setLockedUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (error) {
      setLockedUsersError(error.response?.data?.message || error.message || 'Unable to refresh locked accounts.');
    } finally {
      setRefreshingLockedUsers(false);
    }
  };

  const handleUnlockLockedUser = async (userId) => {
    if (!canManageSystem) {
      setLockedUsersError('Only admin accounts can unlock users.');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setLockedUsersError('SuperAdmin session not found. Please sign in again.');
      return;
    }

    setUnlockingUserId(userId);
    setLockedUsersError('');
    setUnlockSuccessMessage('');

    try {
      await unlockUser(userId);
      setUnlockSuccessMessage('User unlocked successfully.');
      setLockedUsers((currentUsers) => currentUsers.filter((user) => user._id !== userId));
    } catch (error) {
      setLockedUsersError(error.response?.data?.message || error.message || 'Unable to unlock user.');
    } finally {
      setUnlockingUserId('');
    }
  };

  if (!hasData) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div
      className="space-y-8 px-8 py-8 pb-10 transition-all duration-300"
      style={{ backgroundColor: isDark ? colors.bg : '#F8F6F0' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Security Hero + System strips */}
      <section className="animate-fade-slide-up">
        <SectionHeader
          icon={Activity}
          title="Security & Privacy Overview"
          subtitle="Live PIR monitoring and encrypted broker status"
        />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
          <IntrusionCard
            motionDetected={pir.current}
            lastEvent={pir.lastEvent}
            alertCount={pir.alertCount}
          />
          <div className="space-y-4">
            <div
              className="rounded-3xl border p-5 transition-all duration-300"
              style={{
                borderColor: colors.border,
                backgroundColor: isDark ? colors.card : '#FFFFFF',
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider mb-3 transition-colors duration-300"
                style={{ color: colors.textSecondary }}>
                System Status
              </p>
              <SystemStrip isConnected={isConnected} />
              {!loadingLockedUsers && lockedUsers.length === 0 && !lockedUsersError && (
                <div
                  className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: isDark ? 'rgba(139,154,127,0.18)' : 'rgba(26,77,46,0.10)',
                    color: isDark ? '#C8AA76' : '#1A4D2E',
                  }}
                >
                  <ShieldCheck size={11} />
                  System Secure
                </div>
              )}
            </div>
            <div
              className="rounded-3xl border p-5 transition-all duration-300"
              style={{
                borderColor: colors.border,
                backgroundColor: isDark ? 'rgba(74,50,33,0.7)' : '#FDF8F2',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Lock size={12} style={{ color: colors.textSecondary }} />
                <p className="text-[10px] font-bold uppercase tracking-wider transition-colors duration-300"
                  style={{ color: colors.textSecondary }}>
                  Privacy Notice
                </p>
              </div>
              <p className="text-[11px] leading-relaxed transition-colors duration-300"
                style={{ color: colors.textSecondary }}>
                All telemetry is transmitted over{' '}
                <strong style={{ color: colors.text }}>MQTTS (TLS 1.3)</strong> to HiveMQ Cloud on port{' '}
                <strong style={{ color: colors.text }}>8883</strong>. No plaintext data leaves this network.
              </p>
            </div>
          </div>
        </div>
      </section>

      {canManageSystem && (
        <LockedAccountsWidget
          lockedUsers={lockedUsers}
          loadingLockedUsers={loadingLockedUsers}
          refreshingLockedUsers={refreshingLockedUsers}
          unlockingUserId={unlockingUserId}
          lockedUsersError={lockedUsersError}
          unlockSuccessMessage={unlockSuccessMessage}
          onRefresh={refreshLockedUsers}
          onUnlock={handleUnlockLockedUser}
        />
      )}

      {/* Multi-Room Historical Chart */}
      {chartHistory.length > 0 && (
        <section className="animate-fade-slide-up delay-100">
          <SectionHeader
            icon={Thermometer}
            title="Multi-Room History Chart"
            subtitle="Temperature trends — Last 20 readings (5s intervals)"
          />
          <div
            className="rounded-3xl border p-6 transition-all duration-300"
            style={{
              borderColor: colors.border,
              backgroundColor: isDark ? colors.card : '#FFFFFF',
            }}
          >
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={chartHistory} 
                  margin={{ top: 10, right: 30, left: 0, bottom: 50 }}
                >
                  <defs>
                    <linearGradient id="gradLR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B8860B" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#B8860B" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradBR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#228B22" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#228B22" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradKT" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A0522D" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#A0522D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  
                  <XAxis 
                    dataKey="time" 
                    stroke={colors.textSecondary}
                    style={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  
                  <YAxis 
                    stroke={colors.textSecondary}
                    style={{ fontSize: 10 }}
                    domain={['dataMin - 2', 'dataMax + 2']}
                  />

                  <Tooltip
                    contentStyle={{
                      background: chartColors.tooltipBg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 10,
                      fontSize: 11,
                      color: colors.text,
                      padding: '8px 12px',
                    }}
                    formatter={(value) => [`${value.toFixed(1)}°C`, '']}
                    labelStyle={{ color: colors.text }}
                  />
                  
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    textColor={colors.text}
                  />
                  
                  {/* Living Room Temperature (Amber) */}
                  <Area
                    type="monotone"
                    dataKey="livingRoomTemp"
                    stroke="#B8860B"
                    fill="url(#gradLR)"
                    name="Living Room (°C)"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={true}
                  />
                  
                  {/* Bedroom Temperature (Green) */}
                  <Area
                    type="monotone"
                    dataKey="bedroomTemp"
                    stroke="#228B22"
                    fill="url(#gradBR)"
                    name="Bedroom (°C)"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={true}
                  />
                  
                  {/* Kitchen Temperature (Rust) */}
                  <Area
                    type="monotone"
                    dataKey="kitchenTemp"
                    stroke="#A0522D"
                    fill="url(#gradKT)"
                    name="Kitchen (°C)"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={true}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Color Legend */}
            <div className="mt-6 grid grid-cols-3 gap-4 text-[11px]">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#B8860B' }} />
                <div>
                  <p className="font-semibold" style={{ color: colors.text }}>Living Room</p>
                  <p style={{ color: colors.textSecondary }}>
                    {allRoomsData?.livingroom?.temperature?.toFixed(1) || '--'}°C
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#228B22' }} />
                <div>
                  <p className="font-semibold" style={{ color: colors.text }}>Bedroom</p>
                  <p style={{ color: colors.textSecondary }}>
                    {allRoomsData?.bedroom?.temperature?.toFixed(1) || '--'}°C
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: '#A0522D' }} />
                <div>
                  <p className="font-semibold" style={{ color: colors.text }}>Kitchen</p>
                  <p style={{ color: colors.textSecondary }}>
                    {allRoomsData?.kitchen?.temperature?.toFixed(1) || '--'}°C
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Live Sensor Widgets */}
      <section className="animate-fade-slide-up delay-150">
        <SectionHeader
          icon={Thermometer}
          title="Live Sensor Readings"
          subtitle="Real-time sensor metrics from IoT devices"
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          {/* Temperature */}
          <LiveSensorWidget
            icon={Thermometer}
            label="Temperature"
            value={temperature.current}
            unit="°C"
            accentLight="#C27B4A"
            accentDark={chartColors.temperature}
            history={temperature.history}
            glowDuration="1.5s"
            animClass="animate-glow-warm"
          />

          {/* Humidity */}
          <LiveSensorWidget
            icon={Droplets}
            label="Humidity"
            value={humidity.current}
            unit="%"
            accentLight="#4A7A9B"
            accentDark={chartColors.humidity}
            history={humidity.history}
            glowDuration="1.2s"
            animClass="animate-glow-cool"
          />

          {/* Light Sensor */}
          <LiveSensorWidget
            icon={Lightbulb}
            label="Light"
            value={lightSensor?.current || 0}
            unit="lux"
            accentLight="#D4A574"
            accentDark="#E5D4B8"
            history={lightSensor?.history || []}
            glowDuration="1.5s"
            animClass="animate-glow-warm"
          />

          {/* PIR Motion — binary widget, no sparkline */}
          <motion.div
            className={`relative rounded-3xl border p-6 transition-all duration-500 overflow-hidden cursor-pointer ${
              pir.current ? 'animate-glow-alert' : ''
            }`}
            style={{
              borderColor: pir.current ? 'rgba(220,100,100,0.3)' : colors.border,
              backgroundColor: pir.current
                ? (isDark ? 'rgba(42,21,21,0.9)' : 'rgba(254,242,242,1)')
                : (isDark ? colors.card : '#FFFFFF'),
            }}
            whileHover={!pir.current ? { y: -4, scale: 1.02, transition: { duration: 0.25 } } : {}}
          >
            {/* Status dot */}
            <div className="absolute top-4 right-4">
              {pir.current
                ? <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                  </span>
                : <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex h-2 w-2 rounded-full"
                      style={{ background: isDark ? '#C8AA76' : '#1A4D2E' }} />
                  </span>
              }
            </div>

            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="grid h-8 w-8 place-items-center rounded-[12px] transition-colors duration-300"
                style={{
                  backgroundColor: pir.current
                    ? (isDark ? 'rgba(220,60,60,0.15)' : 'rgba(254,226,226,1)')
                    : (isDark ? 'rgba(200,170,118,0.15)' : 'rgba(26,77,46,0.1)'),
                }}
              >
                {pir.current
                  ? <AlertTriangle size={16} className="text-red-500" />
                  : <ShieldCheck  size={16} style={{ color: isDark ? '#C8AA76' : '#1A4D2E' }} />
                }
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider transition-colors duration-300"
                style={{ color: colors.textSecondary }}
              >
                Motion Status
              </span>
            </div>

            <p
              className={`font-display text-3xl font-bold mb-2 transition-colors duration-300 ${pir.current ? 'text-red-500' : ''}`}
              style={{ color: pir.current ? undefined : (isDark ? '#C8AA76' : '#1A4D2E') }}
            >
              {pir.current ? 'Detected' : 'Secure'}
            </p>
            {pir.lastEvent && (
              <p className="text-[11px] transition-colors duration-300" style={{ color: colors.textSecondary }}>
                Last: {pir.lastEvent}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Device Controls + MQTT Log */}
      <section className="animate-fade-slide-up delay-300">
        <SectionHeader
          icon={Zap}
          title="Active Devices"
          subtitle={canControlDevices ? 'Relay-controlled actuators via ESP32' : 'Customer accounts can monitor device status'}
        />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr_1.1fr]">
          <LightControl
            initialBrightness={light.brightness}
            disabled={!canControlDevices}
            onBrightnessChange={(brightness) => toggleDevice('light', brightness)}
          />
          <FanControl
            initialSpeed={fan.speed}
            disabled={!canControlDevices}
            onSpeedChange={(speed) => toggleDevice('fan', speed)}
          />
          <CommandLog entries={commandLog} />
        </div>
      </section>
    </motion.div>
  );
}
