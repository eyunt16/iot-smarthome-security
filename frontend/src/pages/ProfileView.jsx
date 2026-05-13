/**
 * ProfileView.jsx — System Profile & Privacy Settings
 *
 * Features:
 *   • Prominent "Data Encryption Active" MQTTS badge
 *   • User profile card
 *   • Privacy settings (local state toggles)
 *   • System info table
 *
 * Fully theme-aware via useTheme() — no hardcoded light-mode colors.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  Database,
  Fingerprint,
  Globe,
  Lock,
  Mail,
  Server,
  Shield,
  Sparkles,
  ToggleRight,
} from 'lucide-react';
import { SectionHeader }  from '../components/ui/SectionHeader';
import { ToggleSwitch }   from '../components/ui/ToggleSwitch';
import { useTheme }       from '../contexts/DarkModeContext';

// ── Encryption Hero Banner ────────────────────────────────────
// Light mode: deep forest green (premium secure feel).
// Dark mode: softer mocha-green that integrates with Airy Dim palette.
function EncryptionBanner({ isConnected }) {
  const { isDark } = useTheme();

  const cardBg = isConnected
    ? (isDark
        ? 'linear-gradient(135deg, #1E2E20 0%, #172518 100%)'
        : 'linear-gradient(135deg, #0f2e14 0%, #081a0b 100%)')
    : (isDark
        ? 'linear-gradient(135deg, #2E2820 0%, #261F18 100%)'
        : 'linear-gradient(135deg, #1e1a14 0%, #120f09 100%)');

  const borderColor = isConnected
    ? (isDark ? 'rgba(34,197,94,0.25)' : 'rgba(20,83,45,0.3)')
    : (isDark ? 'rgba(92,77,66,0.5)'   : 'rgba(139,115,85,0.2)');

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-7 border transition-all duration-300"
      style={{ background: cardBg, borderColor }}
    >
      <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full bg-green-700/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-green-500/20">
              <Lock size={20} className="text-green-300" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">Privacy Status</p>
              <p className={`text-[13px] font-bold ${isConnected ? 'text-green-300' : 'text-white/60'}`}>
                {isConnected ? 'Data Encryption Active' : 'Awaiting Connection'}
              </p>
            </div>
          </div>
          <h2 className="font-display text-3xl font-bold text-white mb-2">MQTTS Encrypted</h2>
          <p className="text-[13px] text-white/50 max-w-sm leading-relaxed">
            All sensor telemetry and device commands are transmitted over TLS 1.3 to HiveMQ Cloud.
            No unencrypted data leaves this network.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { label: 'Protocol', value: 'MQTTS / TLS 1.3' },
            { label: 'Port',     value: '8883 (secure)' },
            { label: 'Broker',   value: 'HiveMQ Cloud' },
            { label: 'Status',   value: isConnected ? '🟢 Active' : '⚪ Connecting' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl bg-white/5 px-4 py-2.5">
              <span className="text-[11px] text-white/40 w-20 shrink-0">{label}</span>
              <span className="text-[12px] font-semibold text-white/80">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Privacy Settings ──────────────────────────────────────────
const INITIAL_SETTINGS = [
  { id: 'notif',      icon: Bell,        title: 'Motion Notifications', desc: 'Receive alerts when the PIR sensor detects movement.',                    default: true  },
  { id: 'datalog',    icon: Database,    title: 'Sensor Data Logging',  desc: 'Store historical readings to the local SQLite database.',                 default: true  },
  { id: 'remote',     icon: Globe,       title: 'Remote Access',        desc: 'Allow control from outside the local network via MQTTS.',                 default: false },
  { id: 'biometric',  icon: Fingerprint, title: 'Biometric Auth',       desc: 'Require fingerprint verification for Security toggle changes.',           default: false },
  { id: 'emailalert', icon: Mail,        title: 'Email Alerts',         desc: 'Send email on security alerts (requires SMTP config).',                   default: false },
];

function PrivacySettings() {
  const { isDark, colors } = useTheme();
  const [settings, setSettings] = useState(() =>
    Object.fromEntries(INITIAL_SETTINGS.map(s => [s.id, s.default]))
  );

  return (
    <div
      className="rounded-3xl border p-6 transition-all duration-300"
      style={{
        backgroundColor: isDark ? colors.card : '#FFFFFF',
        borderColor: colors.border,
        boxShadow: isDark
          ? '0 4px 12px rgba(0,0,0,0.15)'
          : '0 4px 20px rgba(155,124,84,0.07)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="grid h-8 w-8 place-items-center rounded-[12px] transition-colors duration-300"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(197,168,128,0.25), rgba(197,168,128,0.10))'
              : 'linear-gradient(135deg, #f2e4cc, #e8d4b0)',
          }}
        >
          <ToggleRight size={15} style={{ color: isDark ? colors.accent : '#8b7355' }} />
        </div>
        <div>
          <p className="text-[13px] font-bold transition-colors duration-300" style={{ color: colors.text }}>
            Privacy &amp; Notification Settings
          </p>
          <p className="text-[10px] transition-colors duration-300" style={{ color: colors.textSecondary }}>
            All settings are stored locally
          </p>
        </div>
      </div>

      {/* Setting rows */}
      <div className="space-y-3">
        {INITIAL_SETTINGS.map(({ id, icon: Icon, title, desc }) => (
          <div
            key={id}
            className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 transition-all duration-200"
            style={{
              borderColor: settings[id]
                ? (isDark ? `${colors.accent}30` : '#e3d8c5')
                : colors.border,
              backgroundColor: settings[id]
                ? (isDark ? colors.accentBg : '#fdf8f2')
                : (isDark ? `${colors.card}` : '#f9f7f3'),
            }}
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl mt-0.5 transition-all duration-200"
                style={{
                  backgroundColor: settings[id]
                    ? (isDark ? 'rgba(197,168,128,0.20)' : '#f2e4cc')
                    : (isDark ? 'rgba(197,168,128,0.08)' : '#ece5d8'),
                  color: settings[id]
                    ? (isDark ? colors.accent : '#8b7355')
                    : (isDark ? colors.textSecondary : '#b09a7d'),
                }}
              >
                <Icon size={14} strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold transition-colors duration-300" style={{ color: colors.text }}>
                  {title}
                </p>
                <p className="text-[11px] leading-relaxed mt-0.5 transition-colors duration-300" style={{ color: colors.textSecondary }}>
                  {desc}
                </p>
              </div>
            </div>
            <ToggleSwitch
              id={`setting-${id}`}
              checked={settings[id]}
              onChange={(v) => setSettings(p => ({ ...p, [id]: v }))}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── System Info ───────────────────────────────────────────────
function SystemInfo() {
  const { isDark, colors } = useTheme();

  const rows = [
    { label: 'Project Name',    value: 'Tuyen Home — IoT Smart Home' },
    { label: 'Focus',           value: 'Security & Privacy' },
    { label: 'Microcontroller', value: 'ESP32' },
    { label: 'Sensors',         value: 'DHT11 · PIR HC-SR501' },
    { label: 'Broker',          value: 'HiveMQ Cloud (MQTTS)' },
    { label: 'Frontend',        value: 'React 19 · Tailwind CSS v4' },
    { label: 'Backend',         value: 'Flask · SQLite' },
    { label: 'Design System',   value: '"Warm Sanctuary"' },
  ];

  return (
    <div
      className="rounded-3xl border p-6 transition-all duration-300"
      style={{
        backgroundColor: isDark ? colors.card : '#FFFFFF',
        borderColor: colors.border,
        boxShadow: isDark
          ? '0 4px 12px rgba(0,0,0,0.15)'
          : '0 4px 20px rgba(155,124,84,0.07)',
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="grid h-8 w-8 place-items-center rounded-[12px] transition-colors duration-300"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(197,168,128,0.25), rgba(197,168,128,0.10))'
              : 'linear-gradient(135deg, #f2e4cc, #e8d4b0)',
          }}
        >
          <Server size={15} style={{ color: isDark ? colors.accent : '#8b7355' }} />
        </div>
        <p className="text-[13px] font-bold transition-colors duration-300" style={{ color: colors.text }}>
          System Information
        </p>
      </div>

      <div
        className="divide-y transition-colors duration-300"
        style={{ borderColor: colors.border }}
      >
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="flex items-center justify-between py-3 gap-4"
            style={{ borderColor: colors.border }}
          >
            <span className="text-[12px] transition-colors duration-300" style={{ color: colors.textSecondary }}>
              {label}
            </span>
            <span
              className="text-[12px] font-semibold text-right max-w-[55%] transition-colors duration-300"
              style={{ color: colors.text }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────
export default function ProfileView({ isConnected, currentUser }) {
  const { isDark, colors } = useTheme();
  const role = String(currentUser?.role || 'admin').toLowerCase();
  const isAdmin = role === 'admin';
  const displayName = currentUser?.username || 'User';
  const roleLabel = isAdmin ? 'System Admin' : 'Customer';
  const accessLabel = isAdmin ? 'Full Control' : 'Monitoring Only';

  return (
    <motion.div
      className="space-y-8 px-8 py-8 pb-10"
      style={{ backgroundColor: isDark ? colors.bg : '#F8F6F0' }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* MQTTS Encryption Banner */}
      <section>
        <SectionHeader icon={Shield} title="Security & Privacy Status" />
        <EncryptionBanner isConnected={isConnected} />
      </section>

      {/* Profile + Settings */}
      <section>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_1fr]">

          {/* Profile card */}
          <div
            className="rounded-3xl border p-6 self-start transition-all duration-300"
            style={{
              backgroundColor: isDark ? colors.card : '#FFFFFF',
              borderColor: colors.border,
              boxShadow: isDark
                ? '0 4px 12px rgba(0,0,0,0.15)'
                : '0 4px 20px rgba(155,124,84,0.07)',
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-[#dac3a1] to-[#8f7651] shadow-[0_8px_24px_rgba(143,118,81,0.35)] mb-4">
                <Sparkles size={32} className="text-white" />
              </div>
              <h3
                className="font-display text-xl font-bold transition-colors duration-300"
                style={{ color: colors.text }}
              >
                {displayName}
              </h3>
              <p
                className="text-[11px] uppercase tracking-wider mt-1 transition-colors duration-300"
                style={{ color: colors.textSecondary }}
              >
                {roleLabel}
              </p>

              <div className="mt-4 w-full space-y-2 text-left">
                {[
                  { label: 'Role',     value: roleLabel },
                  { label: 'Access',   value: accessLabel },
                  { label: 'Sessions', value: '1 active' },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex justify-between rounded-xl px-3 py-2 transition-colors duration-300"
                    style={{ backgroundColor: isDark ? `${colors.bg}80` : '#fdf8f2' }}
                  >
                    <span className="text-[11px] transition-colors duration-300" style={{ color: colors.textSecondary }}>
                      {label}
                    </span>
                    <span className="text-[11px] font-semibold transition-colors duration-300" style={{ color: colors.text }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-1.5 rounded-full border border-green-200/60 bg-green-500/10 px-3 py-1.5">
                <CheckCircle2 size={12} className="text-green-500" />
                <span className="text-[10px] font-bold text-green-500">Authenticated</span>
              </div>
            </div>
          </div>

          <PrivacySettings />
        </div>
      </section>

      {/* System Info */}
      <section>
        <SectionHeader icon={Server} title="System Information" subtitle="Hardware and software stack details" />
        <SystemInfo />
      </section>
    </motion.div>
  );
}
