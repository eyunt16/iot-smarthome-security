/**
 * SecurityView.jsx — Security Center page
 *
 * Features:
 *   • PIR Motion status (hero card)
 *   • Intrusion Alert Log with realistic placeholder data + live entries
 *   • Biometric Lock toggle (simulated)
 *   • MQTTS connection detail
 *
 * Fully theme-aware via useTheme() — no hardcoded light-mode colors.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  Fingerprint,
  Lock,
  LockOpen,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  UserX,
} from 'lucide-react';
import { SectionHeader }  from '../components/ui/SectionHeader';
import { ToggleSwitch }   from '../components/ui/ToggleSwitch';
import { useTheme }       from '../contexts/DarkModeContext';
import { getLockedUsers, unlockUser } from '../services/api';

// ── Static seed log entries ───────────────────────────────────
const SEED_ALERTS = [
  { id: 'seed-1', time: '12:47:02', type: 'alert',   msg: 'Motion detected — PIR sensor triggered' },
  { id: 'seed-2', time: '12:51:38', type: 'clear',   msg: 'Area clear — no further motion' },
  { id: 'seed-3', time: '13:05:14', type: 'alert',   msg: 'Motion detected — PIR sensor triggered' },
  { id: 'seed-4', time: '13:06:01', type: 'clear',   msg: 'Area clear — no further motion' },
  { id: 'seed-5', time: '13:22:55', type: 'system',  msg: 'Security Light activated (automated deterrent)' },
  { id: 'seed-6', time: '13:23:09', type: 'clear',   msg: 'Security Light deactivated' },
];

// ── PIR Hero Card ─────────────────────────────────────────────
function PirHeroCard({ motionDetected, lastEvent, alertCount }) {
  const { isDark } = useTheme();

  // Light mode: dramatic dark contrast (intentional premium feel).
  // Dark mode: softer mocha-tinted cards that sit inside the Airy Dim palette.
  const cardBg = motionDetected
    ? (isDark
        ? 'linear-gradient(135deg, #3D2020 0%, #2E1515 100%)'
        : 'linear-gradient(135deg, #3d1010 0%, #1e0808 100%)')
    : (isDark
        ? 'linear-gradient(135deg, #1E2E20 0%, #172518 100%)'
        : 'linear-gradient(135deg, #0e2610 0%, #091709 100%)');

  const borderCls = motionDetected
    ? 'border-red-900/40'
    : 'border-green-900/30';

  const shadowCls = motionDetected
    ? (isDark ? 'shadow-[0_16px_40px_rgba(160,30,30,0.30)]' : 'shadow-[0_20px_56px_rgba(190,40,40,0.42)]')
    : (isDark ? 'shadow-[0_16px_40px_rgba(20,80,30,0.20)]'  : 'shadow-[0_20px_56px_rgba(30,100,40,0.24)]');

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-7 border transition-all duration-500 ${borderCls} ${shadowCls}`}
      style={{ background: cardBg }}
    >
      <div className={`pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full blur-3xl transition-all duration-700 ${
        motionDetected ? 'bg-red-600/20' : 'bg-green-700/15'
      }`} />
      {motionDetected && (
        <div className="absolute inset-0 animate-pulse rounded-3xl border-2 border-red-500/20" />
      )}

      <div className="relative flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/40 mb-2">PIR Motion Sensor · ESP32</p>
          <h2 className="font-display text-3xl font-bold text-white">Intrusion Detection</h2>
        </div>
        <div className={`grid h-14 w-14 place-items-center rounded-2xl ${
          motionDetected ? 'bg-red-500/25 text-red-300' : 'bg-green-500/20 text-green-300'
        }`}>
          {motionDetected ? <ShieldAlert size={28} /> : <ShieldCheck size={28} />}
        </div>
      </div>

      <div className="relative flex flex-wrap items-center gap-3">
        <div className={`inline-flex items-center gap-2.5 rounded-2xl px-5 py-3 text-sm font-bold ${
          motionDetected ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
        }`}>
          {motionDetected ? <Eye size={16} /> : <EyeOff size={16} />}
          {motionDetected ? 'Motion Detected — ALERT' : 'No Activity — Secure'}
        </div>
        {alertCount > 0 && (
          <span className="rounded-full bg-red-500/25 px-3 py-1 text-[12px] font-bold text-red-300">
            {alertCount} intrusion{alertCount > 1 ? 's' : ''} this session
          </span>
        )}
      </div>
      {lastEvent && (
        <p className="relative mt-3 text-[11px] text-white/30">Last event: {lastEvent}</p>
      )}
    </div>
  );
}

// ── Alert Log ─────────────────────────────────────────────────
function AlertLog({ liveEntries }) {
  const { isDark, colors } = useTheme();
  const all = [...liveEntries, ...SEED_ALERTS].slice(0, 30);

  // Theme-aware log entry styles
  const LOG_STYLE = {
    alert: {
      bg:     isDark ? 'rgba(220,60,60,0.10)' : 'rgba(254,226,226,0.8)',
      border: isDark ? 'rgba(220,60,60,0.22)' : 'rgba(252,165,165,0.5)',
      dot:    '#F87171',
      text:   isDark ? '#F87171' : '#B91C1C',
    },
    clear: {
      bg:     isDark ? 'rgba(52,211,153,0.08)' : 'rgba(209,250,229,0.7)',
      border: isDark ? 'rgba(52,211,153,0.20)' : 'rgba(110,231,183,0.5)',
      dot:    '#34D399',
      text:   isDark ? '#6EE7B7' : '#065F46',
    },
    system: {
      bg:     isDark ? 'rgba(251,191,36,0.08)' : 'rgba(254,243,199,0.8)',
      border: isDark ? 'rgba(251,191,36,0.20)' : 'rgba(253,230,138,0.6)',
      dot:    '#FBBF24',
      text:   isDark ? '#FCD34D' : '#92400E',
    },
  };

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
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="grid h-8 w-8 place-items-center rounded-[12px] transition-colors duration-300"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(197,168,128,0.25), rgba(197,168,128,0.10))'
                : 'linear-gradient(135deg, #f2e4cc, #e8d4b0)',
            }}
          >
            <AlertTriangle size={15} style={{ color: isDark ? colors.accent : '#8b7355' }} />
          </div>
          <div>
            <p className="text-[13px] font-bold transition-colors duration-300" style={{ color: colors.text }}>
              Intrusion Alert Log
            </p>
            <p className="text-[10px] transition-colors duration-300" style={{ color: colors.textSecondary }}>
              {all.length} entries · Live
            </p>
          </div>
        </div>
        <span
          className="rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors duration-300"
          style={{
            borderColor: colors.border,
            backgroundColor: isDark ? colors.accentBg : '#f8f2e8',
            color: isDark ? colors.accent : '#8b7355',
          }}
        >
          Session
        </span>
      </div>

      {/* Log entries */}
      <div className="space-y-2 max-h-[340px] overflow-y-auto scrollbar-hidden pr-1">
        {all.map((entry) => {
          const s = LOG_STYLE[entry.type] ?? LOG_STYLE.system;
          return (
            <div
              key={entry.id}
              className="flex items-start gap-3 rounded-2xl border px-4 py-3 transition-all duration-200"
              style={{ backgroundColor: s.bg, borderColor: s.border }}
            >
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.dot }} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold" style={{ color: s.text }}>{entry.msg}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock size={9} style={{ color: colors.textSecondary }} />
                  <span className="text-[10px] font-mono" style={{ color: colors.textSecondary }}>
                    {entry.time}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Biometric Lock Card ───────────────────────────────────────
function BiometricLockCard() {
  const { isDark, colors } = useTheme();
  const [locked,    setLocked]    = useState(true);
  const [unlocking, setUnlocking] = useState(false);

  const handleToggle = (v) => {
    if (v === false) {
      setUnlocking(true);
      setTimeout(() => { setLocked(false); setUnlocking(false); }, 1800);
    } else {
      setLocked(true);
    }
  };

  const accent = isDark ? colors.accent : '#A67B5B';

  return (
    <div
      className="rounded-3xl border p-6 transition-all duration-500"
      style={{
        backgroundColor: !locked
          ? (isDark ? 'rgba(197,168,128,0.12)' : '#fff8f0')
          : (isDark ? colors.card : '#FFFFFF'),
        borderColor: !locked
          ? (isDark ? `${colors.accent}50` : '#e8c87a99')
          : colors.border,
        boxShadow: !locked
          ? `0 8px 32px ${accent}30`
          : (isDark ? '0 4px 12px rgba(0,0,0,0.15)' : '0 4px 20px rgba(155,124,84,0.07)'),
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="grid h-8 w-8 place-items-center rounded-[12px] transition-all duration-300"
              style={{
                backgroundColor: unlocking
                  ? 'rgba(251,191,36,0.15)'
                  : !locked
                    ? (isDark ? 'rgba(251,191,36,0.12)' : '#fef3c7')
                    : (isDark ? colors.accentBg : '#f0e8d5'),
              }}
            >
              {unlocking
                ? <Fingerprint size={16} style={{ color: '#FBBF24' }} className="animate-pulse" />
                : <Lock size={15} style={{ color: !locked ? '#F59E0B' : (isDark ? colors.accent : '#9b886f') }} />
              }
            </div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider transition-colors duration-300"
              style={{ color: colors.textSecondary }}
            >
              Biometric Lock
            </span>
          </div>

          <h3
            className="font-display text-xl font-bold transition-colors duration-300"
            style={{ color: colors.text }}
          >
            {unlocking ? 'Scanning…' : locked ? 'Room Locked' : 'Room Unlocked'}
          </h3>
          <p
            className="mt-1 text-[11px] max-w-[200px] leading-relaxed transition-colors duration-300"
            style={{ color: colors.textSecondary }}
          >
            {locked
              ? 'Fingerprint or PIN required for entry. All unauthorised access is logged.'
              : 'Biometric verified. Access granted. Auto-locks in 30 s.'
            }
          </p>
        </div>

        <ToggleSwitch
          id="biometric-lock-toggle"
          checked={!locked}
          onChange={(v) => handleToggle(v)}
          variant="warm"
          disabled={unlocking}
        />
      </div>

      {/* Status badge */}
      <div
        className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all duration-300"
        style={{
          backgroundColor: unlocking
            ? 'rgba(251,191,36,0.15)'
            : !locked
              ? (isDark ? 'rgba(251,191,36,0.12)' : 'rgba(251,191,36,0.10)')
              : (isDark ? colors.accentBg : '#f0e8d5'),
          color: unlocking || !locked
            ? '#F59E0B'
            : (isDark ? colors.textSecondary : '#8e7d68'),
        }}
      >
        {unlocking
          ? <><Fingerprint size={11} className="animate-pulse" /> Verifying biometric…</>
          : !locked
            ? <><ShieldOff size={11} /> ACCESS GRANTED</>
            : <><ShieldCheck size={11} /> LOCKED — Secure</>
        }
      </div>
    </div>
  );
}

function LockedAccountsPanel() {
  const { isDark, colors } = useTheme();
  const [lockedUsers, setLockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unlockingUserId, setUnlockingUserId] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchLockedUsers = async ({ silent = false } = {}) => {
    const token = localStorage.getItem('token');

    if (!token) {
      setError('SuperAdmin session not found. Please sign in again.');
      setLockedUsers([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const data = await getLockedUsers();
      setLockedUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to load locked accounts.');
      setLockedUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLockedUsers();
  }, []);

  const handleUnlock = async (userId) => {
    const token = localStorage.getItem('token');

    if (!token) {
      setError('SuperAdmin session not found. Please sign in again.');
      return;
    }

    setUnlockingUserId(userId);
    setError('');
    setSuccessMessage('');

    try {
      await unlockUser(userId);
      setSuccessMessage('User unlocked successfully.');
      await fetchLockedUsers({ silent: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to unlock user.');
    } finally {
      setUnlockingUserId('');
    }
  };

  return (
    <div
      className="rounded-3xl border p-6 transition-all duration-300"
      style={{
        backgroundColor: isDark ? colors.card : '#FFFFFF',
        borderColor: colors.border,
        boxShadow: isDark
          ? '0 8px 24px rgba(0,0,0,0.16)'
          : '0 10px 30px rgba(155,124,84,0.08)',
      }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-5">
        <div className="flex items-start gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(248,113,113,0.18), rgba(248,113,113,0.08))'
                : 'linear-gradient(135deg, rgba(220,60,60,0.12), rgba(220,60,60,0.05))',
            }}
          >
            <UserX size={18} style={{ color: isDark ? '#FCA5A5' : '#B91C1C' }} />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold" style={{ color: colors.text }}>
              Locked Accounts Management
            </h3>
            <p className="text-[11px]" style={{ color: colors.textSecondary }}>
              Review locked users and restore access after security verification.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchLockedUsers({ silent: true })}
          disabled={loading || refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-[12px] font-bold transition-all duration-200 disabled:opacity-60"
          style={{
            borderColor: colors.border,
            color: colors.text,
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FAF7F1',
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh List
        </button>
      </div>

      {error && (
        <div
          className="mb-4 rounded-2xl border px-4 py-3 text-sm font-medium"
          style={{
            borderColor: '#D98B8B',
            backgroundColor: 'rgba(220,100,100,0.10)',
            color: '#B55B5B',
          }}
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          className="mb-4 rounded-2xl border px-4 py-3 text-sm font-medium"
          style={{
            borderColor: '#88C9A0',
            backgroundColor: 'rgba(100,200,140,0.10)',
            color: '#2F7A52',
          }}
        >
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[220px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-medium" style={{ color: colors.textSecondary }}>
            <RefreshCw size={16} className="animate-spin" />
            Loading locked accounts...
          </div>
        </div>
      ) : lockedUsers.length === 0 ? (
        <div
          className="flex min-h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed px-6 text-center"
          style={{
            borderColor: colors.border,
            backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#FCFAF6',
          }}
        >
          <ShieldCheck size={24} style={{ color: isDark ? colors.accent : '#1A4D2E' }} />
          <p className="mt-4 text-base font-bold" style={{ color: colors.text }}>
            No locked accounts found. System is secure!
          </p>
          <p className="mt-2 max-w-md text-sm" style={{ color: colors.textSecondary }}>
            Every user account is currently accessible and no administrative unlock action is required.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border" style={{ borderColor: colors.border }}>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FAF7F1',
                }}
              >
                <tr>
                  {['Username', 'Email', 'Failed Attempts', 'Last Login IP', 'Action'].map((label) => (
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
                    <td className="px-4 py-4 text-sm" style={{ color: colors.textSecondary }}>
                      {user.lastLoginIP || 'Not available'}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleUnlock(user._id)}
                        disabled={unlockingUserId === user._id}
                        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-bold transition-all duration-200 disabled:opacity-60"
                        style={{
                          background: isDark
                            ? 'linear-gradient(135deg, rgba(197,168,128,0.22), rgba(197,168,128,0.12))'
                            : 'linear-gradient(135deg, #E8F2EC, #DDEEE4)',
                          color: isDark ? colors.accent : '#1A4D2E',
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
                            Unlock Account
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
  );
}

// ── MAIN ──────────────────────────────────────────────────────
export default function SecurityView({ sensorData, commandLog }) {
  const { isDark, colors } = useTheme();
  const { motion: pir } = sensorData;  // renamed: avoids shadowing framer-motion's `motion`

  // Filter live alert events for the log
  const liveAlerts = commandLog
    .filter(e => e.type === 'alert' || (e.type === 'publish' && e.topic.includes('device')))
    .map(e => ({
      id:   e.id,
      time: e.time,
      type: e.type === 'alert' ? 'alert' : 'system',
      msg:  e.type === 'alert' ? 'Motion detected — PIR sensor triggered' : `Device command: ${e.topic} → ${e.payload}`,
    }));

  return (
    <motion.div
      className="space-y-8 px-8 py-8 pb-10"
      style={{ backgroundColor: isDark ? colors.bg : '#F8F6F0' }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* PIR Hero */}
      <section>
        <SectionHeader icon={ShieldCheck} title="Intrusion Detection" subtitle="PIR passive infrared motion sensor · ESP32" />
        <PirHeroCard
          motionDetected={pir.current}
          lastEvent={pir.lastEvent}
          alertCount={pir.alertCount}
        />
      </section>

      {/* Log + Biometric side-by-side */}
      <section>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_360px]">
          <AlertLog liveEntries={liveAlerts} />
          <div className="space-y-5">
            <BiometricLockCard />

            {/* MQTTS detail card */}
            <div
              className="rounded-3xl border p-6 transition-all duration-300"
              style={{
                backgroundColor: isDark ? colors.card : '#fdf8f2',
                borderColor: isDark ? colors.border : '#e0cdb0',
                background: isDark
                  ? undefined
                  : 'linear-gradient(to bottom right, #fdf8f2, #f7f0e3)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Lock size={13} style={{ color: isDark ? colors.accent : '#8b7355' }} />
                <p
                  className="text-[11px] font-bold uppercase tracking-wider transition-colors duration-300"
                  style={{ color: isDark ? colors.textSecondary : '#8b7355' }}
                >
                  Protocol Security
                </p>
              </div>
              <div className="space-y-2">
                {[
                  ['Encryption',  'TLS 1.3 (MQTTS)'],
                  ['Port',        '8883 (secure)'],
                  ['Broker',      'HiveMQ Cloud'],
                  ['Auth',        'Username + Password'],
                  ['Plaintext',   'Disabled'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-[12px]">
                    <span style={{ color: colors.textSecondary }}>{k}</span>
                    <span className="font-semibold" style={{ color: colors.text }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          icon={UserX}
          title="Locked Accounts"
          subtitle="SuperAdmin recovery controls for security-triggered account lockouts"
        />
        <LockedAccountsPanel />
      </section>
    </motion.div>
  );
}
