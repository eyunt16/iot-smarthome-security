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
import { getAllUsers, unlockUser, createCustomerAccount, banUser, unbanUser, getSecurityLogs, clearSecurityLogs, unlockDoor } from '../services/api';
import { triggerDesktopNotification } from '../utils/notification';

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

// ── Smart Door Lock Card ───────────────────────────────────────
function SmartDoorLockCard({ publish }) {
  const { isDark, colors } = useTheme();
  const [locked, setLocked] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleToggle = (toUnlocked) => {
    if (toUnlocked) {
      // Intercept unlock attempt, pop up PIN modal
      setShowPinModal(true);
      setPinInput('');
      setPinError(false);
    } else {
      // Lock immediately
      setLocked(true);
      if (publish) {
        publish('home/door/control', 'lock');
      }
    }
  };

  const handleKeyPress = async (num) => {
    setPinError(false);
    if (pinInput.length < 4) {
      const nextPin = pinInput + num;
      setPinInput(nextPin);
      
      // Auto-submit if 4 digits are completed
      if (nextPin.length === 4) {
        try {
          await unlockDoor(nextPin);
          setLocked(false);
          setShowPinModal(false);
          setPinInput('');
        } catch (err) {
          // Wrong PIN or rate limited
          setPinError(true);
          setPinInput('');
        }
      }
    }
  };

  const handleClear = () => {
    setPinInput(prev => prev.slice(0, -1));
    setPinError(false);
  };

  const accent = isDark ? colors.accent : '#A67B5B';

  return (
    <>
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
                  backgroundColor: !locked
                    ? (isDark ? 'rgba(251,191,36,0.12)' : '#fef3c7')
                    : (isDark ? colors.accentBg : '#f0e8d5'),
                }}
              >
                <Lock size={15} style={{ color: !locked ? '#F59E0B' : (isDark ? colors.accent : '#9b886f') }} />
              </div>
              <span
                className="text-[10px] font-bold uppercase tracking-wider transition-colors duration-300"
                style={{ color: colors.textSecondary }}
              >
                Smart Door Lock
              </span>
            </div>

            <h3
              className="font-display text-xl font-bold transition-colors duration-300"
              style={{ color: colors.text }}
            >
              {locked ? 'Door Locked' : 'Door Unlocked'}
            </h3>
            <p
              className="mt-1 text-[11px] max-w-[200px] leading-relaxed transition-colors duration-300"
              style={{ color: colors.textSecondary }}
            >
              {locked
                ? 'PIN code verification required to unlock. Access logging active.'
                : 'PIN verified. Lock unlocked. Secure connection established.'
              }
            </p>
          </div>

          <ToggleSwitch
            id="smart-door-lock-toggle"
            checked={!locked}
            onChange={(v) => handleToggle(v)}
            variant="warm"
          />
        </div>

        {/* Status badge */}
        <div
          className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all duration-300"
          style={{
            backgroundColor: !locked
              ? (isDark ? 'rgba(251,191,36,0.12)' : 'rgba(251,191,36,0.10)')
              : (isDark ? colors.accentBg : '#f0e8d5'),
            color: !locked
              ? '#F59E0B'
              : (isDark ? colors.textSecondary : '#8e7d68'),
          }}
        >
          {!locked
            ? <><ShieldOff size={11} /> UNLOCKED</>
            : <><ShieldCheck size={11} /> LOCKED — Secure</>
          }
        </div>
      </div>

      {/* GORGEOUS PIN ENTRY MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setShowPinModal(false)}
          />

          {/* Modal Container */}
          <div 
            className="relative w-full max-w-sm rounded-[32px] border p-7 shadow-2xl transition-all duration-300 scale-in"
            style={{
              borderColor: colors.border,
              backgroundColor: isDark ? '#4E4238' : '#FFFFFF',
              color: colors.text,
            }}
          >
            <div className="text-center mb-6">
              <div 
                className="mx-auto grid h-12 w-12 place-items-center rounded-2xl mb-3"
                style={{
                  backgroundColor: pinError ? 'rgba(220,60,50,0.15)' : 'rgba(197,168,128,0.15)',
                  color: pinError ? '#EF4444' : (isDark ? colors.accent : '#8b7355'),
                }}
              >
                <Lock size={20} />
              </div>
              <h3 className="font-display text-lg font-bold">Secure Access</h3>
              <p className="text-[11px] mt-1" style={{ color: colors.textSecondary }}>
                Enter Smart Door Lock PIN to unlock
              </p>
            </div>

            {/* PIN Indicator Dots */}
            <div className="flex justify-center gap-4 mb-7">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pinInput.length > idx;
                return (
                  <div
                    key={idx}
                    className={`h-3.5 w-3.5 rounded-full border transition-all duration-200 ${
                      filled 
                        ? 'scale-110 shadow-lg' 
                        : ''
                    }`}
                    style={{
                      borderColor: pinError ? '#EF4444' : colors.border,
                      backgroundColor: filled
                        ? (pinError ? '#EF4444' : (isDark ? colors.accent : '#8b7355'))
                        : 'transparent'
                    }}
                  />
                );
              })}
            </div>

            {pinError && (
              <p className="text-center text-[11px] text-red-500 font-bold mb-4">
                Incorrect PIN. Please try again.
              </p>
            )}

            {/* Keypad Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(String(num))}
                  className="h-14 rounded-2xl border text-lg font-bold transition-all duration-150 active:scale-95 cursor-pointer"
                  style={{
                    borderColor: colors.border,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FAF7F1',
                    color: colors.text,
                  }}
                >
                  {num}
                </button>
              ))}
              
              <button
                type="button"
                onClick={handleClear}
                className="h-14 rounded-2xl border text-[11px] font-bold uppercase transition-all duration-150 active:scale-95 cursor-pointer"
                style={{
                  borderColor: colors.border,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FAF7F1',
                  color: colors.textSecondary,
                }}
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="h-14 rounded-2xl border text-lg font-bold transition-all duration-150 active:scale-95 cursor-pointer"
                style={{
                  borderColor: colors.border,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FAF7F1',
                  color: colors.text,
                }}
              >
                0
              </button>

              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="h-14 rounded-2xl border text-[11px] font-bold uppercase transition-all duration-150 active:scale-95 cursor-pointer"
                style={{
                  borderColor: colors.border,
                  backgroundColor: isDark ? 'rgba(220,60,50,0.1)' : 'rgba(220,60,50,0.08)',
                  color: '#EF4444',
                }}
              >
                Cancel
              </button>
            </div>
            
            <p className="text-center text-[9px]" style={{ color: colors.textSecondary }}>
              Default PIN: 1234
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function ThreatManagementPanel() {
  const { isDark, colors } = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [banningIp, setBanningIp] = useState(false);
  const [ipForm, setIpForm] = useState({ ipAddress: '', reason: '' });

  const fetchLogs = async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const data = await getSecurityLogs();
      setLogs(Array.isArray(data?.logs) ? data.logs : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load security audit logs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleClear = async () => {
    if (!window.confirm('WARNING: Are you sure you want to CLEAR all security audit logs? This action is permanent and cannot be undone.')) {
      return;
    }
    setError('');
    setSuccess('');
    try {
      await clearSecurityLogs();
      setSuccess('Audit logs cleared successfully.');
      await fetchLogs({ silent: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to clear audit logs.');
    }
  };

  const handleBanIp = async (e) => {
    e.preventDefault();
    setBanningIp(true);
    setError('');
    setSuccess('');
    try {
      const { api } = await import('../services/api');
      await api.post('/auth/ip/ban', { ipAddress: ipForm.ipAddress, reason: ipForm.reason });
      setSuccess(`IP Address ${ipForm.ipAddress} successfully banned.`);
      setIpForm({ ipAddress: '', reason: '' });
      await fetchLogs({ silent: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to ban IP address.');
    } finally {
      setBanningIp(false);
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
                ? 'linear-gradient(135deg, rgba(220,60,50,0.18), rgba(220,60,50,0.08))'
                : 'linear-gradient(135deg, rgba(220,60,50,0.12), rgba(220,60,50,0.05))',
            }}
          >
            <ShieldAlert size={18} style={{ color: '#EF4444' }} />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold" style={{ color: colors.text }}>
              Forensic Threat &amp; Audit Logs
            </h3>
            <p className="text-[11px]" style={{ color: colors.textSecondary }}>
              Review security audit logs, clear audit logs, and blacklist IP addresses.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-[12px] font-bold transition-all duration-200"
            style={{
              borderColor: 'rgba(220,60,50,0.2)',
              backgroundColor: 'rgba(220,60,50,0.08)',
              color: '#EF4444',
            }}
          >
            Clear Audit Logs
          </button>
          <button
            type="button"
            onClick={() => fetchLogs({ silent: true })}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-[12px] font-bold transition-all duration-200 disabled:opacity-60"
            style={{
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FAF7F1',
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border px-4 py-3 text-sm font-medium" style={{ borderColor: '#D98B8B', backgroundColor: 'rgba(220,100,100,0.10)', color: '#B55B5B' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-2xl border px-4 py-3 text-sm font-medium" style={{ borderColor: '#88C9A0', backgroundColor: 'rgba(100,200,140,0.10)', color: '#2F7A52' }}>
          {success}
        </div>
      )}

      {/* IP Blacklist Form */}
      <form onSubmit={handleBanIp} className="mb-6 p-4 rounded-2xl border" style={{ borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#FCFAF6' }}>
        <h4 className="text-sm font-bold mb-3" style={{ color: colors.text }}>Blacklist IP Address</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>IP Address</label>
            <input type="text" required placeholder="e.g. 192.168.1.100" value={ipForm.ipAddress} onChange={e => setIpForm({...ipForm, ipAddress: e.target.value})} className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#fff', borderColor: colors.border, color: colors.text }} />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>Reason</label>
            <input type="text" placeholder="e.g. Repeated brute-force attempts" value={ipForm.reason} onChange={e => setIpForm({...ipForm, reason: e.target.value})} className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#fff', borderColor: colors.border, color: colors.text }} />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" disabled={banningIp} className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50" style={{ backgroundColor: '#EF4444' }}>
            {banningIp ? 'Blacklisting...' : 'Blacklist IP'}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-medium" style={{ color: colors.textSecondary }}>
            <RefreshCw size={16} className="animate-spin" />
            Loading forensic logs...
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm font-bold" style={{ color: colors.textSecondary }}>
          No security events logged.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border" style={{ borderColor: colors.border }}>
          <div className="overflow-x-auto">
            <div className="max-h-[350px] overflow-y-auto pr-1 scrollbar-hidden">
              <table className="min-w-full border-collapse">
                <thead className="sticky top-0 z-10" style={{ backgroundColor: isDark ? '#4E4238' : '#FAF7F1' }}>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    {['Timestamp', 'Event Type', 'Description', 'IP Address'].map((label) => (
                      <th key={label} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={log._id || index} style={{ borderBottom: index < logs.length - 1 ? `1px solid ${colors.border}` : 'none', backgroundColor: index % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.015)' : 'rgba(248,246,240,0.65)') }}>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: colors.textSecondary }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.eventType.includes('BANNED') || log.eventType.includes('FAILED') || log.eventType.includes('LOCKED')
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {log.eventType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold max-w-[300px] truncate" style={{ color: colors.text }}>
                        {log.description}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: colors.textSecondary }}>
                        {log.ipAddress || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserManagementPanel() {
  const { isDark, colors } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unlockingUserId, setUnlockingUserId] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ username: '', email: '', password: '', role: 'customer' });
  const [creating, setCreating] = useState(false);

  const fetchUsers = async ({ silent = false } = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('SuperAdmin session not found. Please sign in again.');
      setUsers([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const data = await getAllUsers();
      setUsers(Array.isArray(data?.users) ? data.users : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to load accounts.');
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUnlock = async (userId) => {
    setUnlockingUserId(userId);
    setError('');
    setSuccessMessage('');
    try {
      await unlockUser(userId);
      setSuccessMessage('User unlocked successfully.');
      await fetchUsers({ silent: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to unlock user.');
    } finally {
      setUnlockingUserId('');
    }
  };

  const handleBan = async (userId) => {
    if (!window.confirm('Are you sure you want to BAN this user? This will lock them out of the system immediately.')) {
      return;
    }
    setError('');
    setSuccessMessage('');
    const targetUser = users.find(u => u._id === userId);
    const username = targetUser ? targetUser.username : 'Unknown';
    try {
      await banUser(userId);
      setSuccessMessage('User account successfully banned.');
      triggerDesktopNotification('🔒 Account Locked', `Account ${username} has been locked.`, {
        tag: 'account-lock-alert'
      });
      await fetchUsers({ silent: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to ban user.');
    }
  };

  const handleUnban = async (userId) => {
    if (!window.confirm('Are you sure you want to UNBAN this user?')) {
      return;
    }
    setError('');
    setSuccessMessage('');
    const targetUser = users.find(u => u._id === userId);
    const username = targetUser ? targetUser.username : 'Unknown';
    try {
      await unbanUser(userId);
      setSuccessMessage('User account successfully unbanned.');
      triggerDesktopNotification('🔓 Account Unlocked', `Account ${username} has been unlocked.`, {
        tag: 'account-lock-alert'
      });
      await fetchUsers({ silent: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to unban user.');
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccessMessage('');
    try {
      await createCustomerAccount({
        username: createForm.username,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
      });
      setSuccessMessage('Customer account created successfully.');
      setCreateForm({ username: '', email: '', password: '', role: 'customer' });
      setShowCreateForm(false);
      await fetchUsers({ silent: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to create account.');
    } finally {
      setCreating(false);
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
                ? 'linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08))'
                : 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.05))',
            }}
          >
            <UserX size={18} style={{ color: isDark ? '#6EE7B7' : '#059669' }} />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold" style={{ color: colors.text }}>
              User Management
            </h3>
            <p className="text-[11px]" style={{ color: colors.textSecondary }}>
              Create accounts and manage access permissions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-[12px] font-bold transition-all duration-200"
            style={{
              borderColor: colors.border,
              backgroundColor: isDark ? colors.accentBg : '#eef8f2',
              color: isDark ? colors.accent : '#059669',
            }}
          >
            Create Customer Account
          </button>
          <button
            type="button"
            onClick={() => fetchUsers({ silent: true })}
            disabled={loading || refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-[12px] font-bold transition-all duration-200 disabled:opacity-60"
            style={{
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FAF7F1',
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div
          className="mb-4 rounded-2xl border px-4 py-3 text-sm font-medium"
          style={{ borderColor: '#D98B8B', backgroundColor: 'rgba(220,100,100,0.10)', color: '#B55B5B' }}
        >
          {error}
        </div>
      )}

      {successMessage && (
        <div
          className="mb-4 rounded-2xl border px-4 py-3 text-sm font-medium"
          style={{ borderColor: '#88C9A0', backgroundColor: 'rgba(100,200,140,0.10)', color: '#2F7A52' }}
        >
          {successMessage}
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateCustomer} className="mb-6 p-4 rounded-2xl border" style={{ borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#FCFAF6' }}>
          <h4 className="text-sm font-bold mb-4" style={{ color: colors.text }}>Create New Account</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>Username</label>
              <input type="text" required value={createForm.username} onChange={e => setCreateForm({...createForm, username: e.target.value})} className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#fff', borderColor: colors.border, color: colors.text }} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>Email</label>
              <input type="email" required value={createForm.email} onChange={e => setCreateForm({...createForm, email: e.target.value})} className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#fff', borderColor: colors.border, color: colors.text }} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>Password</label>
              <input type="password" required minLength={8} value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#fff', borderColor: colors.border, color: colors.text }} />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: colors.textSecondary }}>Role</label>
              <select value={createForm.role} onChange={e => setCreateForm({...createForm, role: e.target.value})} className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors" style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#fff', borderColor: colors.border, color: colors.text }}>
                <option value="customer">HomeOwner</option>
                <option value="guest">Guest</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 rounded-xl text-sm font-bold transition-colors" style={{ color: colors.textSecondary }}>Cancel</button>
            <button type="submit" disabled={creating} className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50" style={{ backgroundColor: isDark ? colors.accent : '#059669' }}>
              {creating ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex min-h-[220px] items-center justify-center">
          <div className="flex items-center gap-3 text-sm font-medium" style={{ color: colors.textSecondary }}>
            <RefreshCw size={16} className="animate-spin" />
            Loading accounts...
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="flex min-h-[220px] items-center justify-center text-sm font-bold" style={{ color: colors.textSecondary }}>
          No accounts found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border" style={{ borderColor: colors.border }}>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FAF7F1' }}>
                <tr>
                  {['Username', 'Email', 'Role', 'Failed Attempts', 'Status', 'Action'].map((label) => (
                    <th key={label} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user._id} style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: index % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.015)' : 'rgba(248,246,240,0.65)') }}>
                    <td className="px-4 py-4 text-sm font-semibold" style={{ color: colors.text }}>{user.username}</td>
                    <td className="px-4 py-4 text-sm" style={{ color: colors.textSecondary }}>{user.email}</td>
                    <td className="px-4 py-4 text-sm" style={{ color: colors.textSecondary }}>{user.role}</td>
                    <td className="px-4 py-4 text-sm font-semibold" style={{ color: colors.text }}>{user.failedLoginAttempts}</td>
                    <td className="px-4 py-4 text-sm">
                      {user.isLocked ? (
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Locked</span>
                      ) : (
                        <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {user.role === 'admin' || user.role === 'SuperAdmin' ? (
                        <span className="text-[10px] uppercase tracking-wider font-bold opacity-40">Protected</span>
                      ) : user.isLocked ? (
                        <button
                          type="button"
                          onClick={() => handleUnban(user._id)}
                          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition-all duration-200"
                          style={{
                            background: isDark ? 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(16,185,129,0.12))' : 'linear-gradient(135deg, #E8F2EC, #DDEEE4)',
                            color: isDark ? '#6EE7B7' : '#1A4D2E',
                          }}
                        >
                          <LockOpen size={12} /> Unban
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBan(user._id)}
                          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition-all duration-200"
                          style={{
                            background: isDark ? 'linear-gradient(135deg, rgba(220,60,50,0.2), rgba(220,60,50,0.1))' : 'linear-gradient(135deg, #FCE8E6, #FADCD9)',
                            color: '#EF4444',
                          }}
                        >
                          <UserX size={12} /> Ban
                        </button>
                      )}
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
export default function SecurityView({ sensorData, commandLog, publish }) {
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
            <SmartDoorLockCard publish={publish} />

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
          icon={ShieldAlert}
          title="Threat Management"
          subtitle="Clear forensic logs, audit active sessions, and blacklist IP addresses"
        />
        <ThreatManagementPanel />
      </section>

      <section>
        <SectionHeader
          icon={UserX}
          title="User Management"
          subtitle="Manage user accounts, roles, and security lockouts"
        />
        <UserManagementPanel />
      </section>
    </motion.div>
  );
}
