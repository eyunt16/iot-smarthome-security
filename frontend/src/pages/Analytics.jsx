import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from '../lib/recharts-shim.js';
import { Droplets, Thermometer } from 'lucide-react';
import { api } from '../services/api';
import { useTheme } from '../contexts/DarkModeContext';

const activityLog = [
  {
    title: 'Target temperature reached',
    detail: 'HVAC controller entered standby',
    time: '10:45 AM'
  },
  {
    title: 'External temperature drop detected',
    detail: 'Climate automation compensation active',
    time: '08:12 AM'
  },
  {
    title: 'Scheduled morning routine',
    detail: 'Temperature adjusted to 22.0 C',
    time: '06:30 AM'
  },
  {
    title: 'Manual override',
    detail: 'User requested temporary boost',
    time: '04:15 AM'
  }
];

export default function Analytics() {
  const { isDark, colors } = useTheme();
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchHistory = async () => {
      try {
        const data = await api.get('/history?limit=10&topic=home/temperature');
        if (!mounted) {
          return;
        }

        const formatted = data
          .map((entry) => ({
            label: new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            value: Number.parseFloat(entry.payload)
          }))
          .reverse();

        setHistory(formatted);
      } catch {
        if (mounted) {
          setError('Could not load sensor history.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      mounted = false;
    };
  }, []);

  const chartData = history.length
    ? history
    : [
        { label: '06:00', value: 20.5 },
        { label: '08:00', value: 21.0 },
        { label: '10:00', value: 21.7 },
        { label: '12:00', value: 22.6 },
        { label: '14:00', value: 23.3 },
        { label: '16:00', value: 22.8 },
        { label: '18:00', value: 21.9 },
        { label: '20:00', value: 21.4 },
        { label: '22:00', value: 21.0 },
        { label: '00:00', value: 20.6 }
      ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-10 px-8 py-8 pb-10"
      style={{ backgroundColor: isDark ? colors.bg : '#F8F6F0' }}
    >
      <section className="grid gap-8 xl:grid-cols-[1.45fr_0.75fr]">
        <div>
          <p className="text-[14px] uppercase tracking-[0.3em] transition-colors duration-300" style={{ color: colors.textSecondary }}>Living Room Sensor Zone</p>
          <h1 className="font-display mt-4 text-[74px] leading-[0.92] tracking-[-0.05em] sm:text-[92px] lg:text-[110px] transition-colors duration-300" style={{ color: colors.text }}>
            Temperature
          </h1>
        </div>

        <div className="justify-self-start xl:justify-self-end">
          <p className="text-right text-[12px] uppercase tracking-[0.28em] transition-colors duration-300" style={{ color: colors.textSecondary }}>Current State</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-display text-[96px] font-semibold leading-none transition-colors duration-300" style={{ color: colors.text }}>22</span>
            <span className="mb-3 text-[38px] font-semibold transition-colors duration-300" style={{ color: colors.accent }}>C</span>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-3 text-[15px] transition-colors duration-300" style={{
            backgroundColor: isDark ? colors.card : '#f4e3c7',
            color: isDark ? colors.textSecondary : '#7a6545',
            boxShadow: isDark 
              ? '0 4px 12px rgba(0, 0, 0, 0.2)'
              : 'inset 0 1px 0 rgba(255,255,255,0.5)'
          }}>
            <Thermometer size={15} />
            Sensor Stable
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_0.75fr]">
        <div className="rounded-3xl border p-6 sm:p-8 transition-colors duration-300" style={{
          backgroundColor: isDark ? colors.card : '#FFFFFF',
          borderColor: colors.border,
        }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-[34px] font-semibold transition-colors duration-300" style={{ color: colors.text }}>Sensor History</h2>
              <p className="mt-2 text-[17px] transition-colors duration-300" style={{ color: colors.textSecondary }}>24-hour climate tracking for the IoT network</p>
            </div>
            <div className="flex rounded-[16px] p-1.5 text-[14px] font-medium transition-colors duration-300" style={{
              backgroundColor: isDark ? `${colors.border}99` : '#f7e9d2',
              color: isDark ? colors.textSecondary : '#9a876d'
            }}>
              {['1D', '1W', '1M'].map((period) => (
                <button
                  key={period}
                  type="button"
                  className={`rounded-[12px] px-4 py-2 transition-all duration-300`}
                  style={period === '1D' ? {
                    backgroundColor: isDark ? colors.accent : '#816c49',
                    color: isDark ? colors.bg : 'white'
                  } : {}}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 h-[340px] rounded-[26px] p-4 transition-colors duration-300" style={{
            backgroundColor: isDark ? `${colors.border}44` : '#f9eedb'
          }}>
            {isLoading ? (
              <div className="grid h-full place-items-center transition-colors duration-300" style={{ color: colors.textSecondary }}>Loading sensor history...</div>
            ) : error ? (
              <div className="grid h-full place-items-center transition-colors duration-300" style={{ color: '#9d6056' }}>{error}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 16, right: 8, left: -24, bottom: 8 }}>
                  <CartesianGrid 
                    vertical={false} 
                    stroke={isDark ? `${colors.border}66` : '#ecd9bc'} 
                  />
                  <XAxis 
                    dataKey="label" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ 
                      fill: isDark ? colors.textSecondary : '#b49f83', 
                      fontSize: 12 
                    }} 
                  />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)' }}
                    contentStyle={{
                      background: isDark ? colors.card : '#fffaf4',
                      border: isDark ? `1px solid ${colors.border}` : '1px solid rgba(144,116,74,0.12)',
                      borderRadius: '18px',
                      color: isDark ? colors.text : '#6a5434',
                      boxShadow: isDark 
                        ? '0 8px 24px rgba(0, 0, 0, 0.3)'
                        : '0 4px 12px rgba(144, 116, 74, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[18, 18, 0, 0]} 
                    fill={isDark ? colors.accent : '#ead7b8'} 
                    isAnimationActive 
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[30px] border p-6 transition-colors duration-300" style={{
            backgroundColor: isDark ? colors.card : '#FFFFFF',
            borderColor: colors.border,
          }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[14px] uppercase tracking-[0.24em] transition-colors duration-300" style={{ color: colors.textSecondary }}>Humidity Sensor</p>
                <p className="font-display mt-2 text-[58px] font-semibold leading-none transition-colors duration-300" style={{ color: colors.text }}>48<span className="text-[34px]" style={{ color: colors.accent }}>%</span></p>
              </div>
              <div className="grid h-16 w-16 place-items-center rounded-[18px] transition-colors duration-300" style={{
                backgroundColor: isDark ? colors.border : '#FFFFFF',
                color: isDark ? colors.accent : '#7b6546',
                boxShadow: isDark 
                  ? '0 10px 24px rgba(0, 0, 0, 0.2)'
                  : '0 10px 24px rgba(120,92,56,0.08)'
              }}>
                <Droplets size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-[32px] p-8 text-white transition-colors duration-300" style={{
            backgroundColor: colors.accent,
            boxShadow: `0 24px 58px ${colors.accent}38`
          }}>
            <p className="text-[13px] uppercase tracking-[0.26em] opacity-80">Target Set Point</p>
            <div className="mt-8 flex items-center justify-between gap-3">
              <button type="button" className="grid h-12 w-12 place-items-center rounded-[16px] border border-white/20 text-[28px] hover:bg-white/10 transition-colors">-</button>
              <div className="font-display text-[64px] font-semibold leading-none">21.5 C</div>
              <button type="button" className="grid h-12 w-12 place-items-center rounded-[16px] border border-white/20 text-[28px] hover:bg-white/10 transition-colors">+</button>
            </div>
            <button type="button" className="mt-8 w-full rounded-[18px] bg-white px-6 py-4 text-[15px] font-semibold uppercase tracking-[0.16em] transition-colors hover:bg-white/90" style={{
              color: colors.accent
            }}>
              Update Device
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[0.62fr_1.38fr]">
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-[38px] font-semibold transition-colors duration-300" style={{ color: colors.text }}>System Integrity</h2>
            <p className="mt-6 max-w-md text-[18px] leading-9 transition-colors duration-300" style={{ color: colors.textSecondary }}>
              The living room sensor network is stable. Current readings indicate balanced thermal conditions and healthy device response.
            </p>
          </div>

          <div className="rounded-[26px] p-6 transition-colors duration-300" style={{
            backgroundColor: isDark ? colors.card : '#eeeaef',
            color: isDark ? colors.textSecondary : '#5f566b',
            border: `1px solid ${colors.border}`,
            boxShadow: isDark 
              ? '0 4px 12px rgba(0, 0, 0, 0.1)'
              : '0 14px 34px rgba(100,86,112,0.08)'
          }}>
            <p className="flex items-center gap-3 text-[18px] font-semibold transition-colors duration-300" style={{ color: isDark ? colors.text : '#5a5f74' }}>
              <span className="text-[18px]">TIP</span>
              Efficiency Tip
            </p>
            <p className="mt-4 text-[17px] leading-8">
              Lowering the target by 0.5 C during evening hours can reduce energy usage without noticeable comfort loss.
            </p>
          </div>
        </div>

        <div>
          <div className="mb-5 flex items-center justify-between border-b pb-5 transition-colors duration-300" style={{
            borderColor: colors.border
          }}>
            <p className="text-[13px] uppercase tracking-[0.28em] transition-colors duration-300" style={{ color: colors.textSecondary }}>Activity Log</p>
            <p className="text-[12px] uppercase tracking-[0.22em] transition-colors duration-300" style={{ color: colors.textSecondary }}>Last 12 Hours</p>
          </div>
          <div className="space-y-4">
            {activityLog.map((entry, index) => (
              <div key={`${entry.title}-${index}`} className="rounded-[24px] px-6 py-6 border transition-colors duration-300" style={{
                backgroundColor: isDark ? colors.card : '#FFFFFF',
                borderColor: colors.border,
              }}>
                <div className="flex items-start gap-4">
                  <span className={`mt-3 h-2.5 w-2.5 rounded-full transition-colors duration-300`} style={{
                    backgroundColor: index === 0 
                      ? (isDark ? '#c27b4a' : '#8d5d60')
                      : colors.border
                  }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-[18px] font-semibold transition-colors duration-300" style={{ color: colors.text }}>{entry.title}</h3>
                        <p className="mt-1 text-[15px] transition-colors duration-300" style={{ color: colors.textSecondary }}>{entry.detail}</p>
                      </div>
                      <span className="text-[14px] transition-colors duration-300" style={{ color: colors.textSecondary }}>{entry.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="mt-8 w-full rounded-[18px] border px-6 py-5 text-[15px] font-semibold uppercase tracking-[0.2em] transition-colors hover:opacity-80" style={{
            borderColor: colors.border,
            backgroundColor: isDark ? `${colors.card}99` : 'rgba(255,255,255,0.5)',
            color: isDark ? colors.textSecondary : '#a48e72'
          }}>
            View Archive
          </button>
        </div>
      </section>
    </motion.div>
  );
}
