import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from '../lib/recharts-shim.js';
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

const SAMPLE_MULTI_SENSOR_DATA = [
  { time: '-9s', ESP8266_Temp: 520, ESP8266_Humi: 85, ESP8266_Light: 610, ESP32_Temp: 790, ESP32_Humi: 360, ESP32_Light: 240 },
  { time: '-8s', ESP8266_Temp: 522, ESP8266_Humi: 88, ESP8266_Light: 625, ESP32_Temp: 790, ESP32_Humi: 365, ESP32_Light: 250 },
  { time: '-7s', ESP8266_Temp: 515, ESP8266_Humi: 92, ESP8266_Light: 680, ESP32_Temp: 790, ESP32_Humi: 372, ESP32_Light: 265 },
  { time: '-6s', ESP8266_Temp: 525, ESP8266_Humi: 96, ESP8266_Light: 785, ESP32_Temp: 790, ESP32_Humi: 368, ESP32_Light: 290 },
  { time: '-5s', ESP8266_Temp: 500, ESP8266_Humi: 82, ESP8266_Light: 410, ESP32_Temp: 790, ESP32_Humi: 360, ESP32_Light: 245 },
  { time: '-4s', ESP8266_Temp: 518, ESP8266_Humi: 90, ESP8266_Light: 720, ESP32_Temp: 790, ESP32_Humi: 362, ESP32_Light: 230 },
  { time: '-3s', ESP8266_Temp: 522, ESP8266_Humi: 87, ESP8266_Light: 395, ESP32_Temp: 790, ESP32_Humi: 370, ESP32_Light: 410 },
  { time: '-2s', ESP8266_Temp: 515, ESP8266_Humi: 80, ESP8266_Light: 120, ESP32_Temp: 790, ESP32_Humi: 366, ESP32_Light: 75 },
  { time: '-1s', ESP8266_Temp: 530, ESP8266_Humi: 98, ESP8266_Light: 430, ESP32_Temp: 790, ESP32_Humi: 372, ESP32_Light: 445 },
  { time: 'Now', ESP8266_Temp: 522, ESP8266_Humi: 90, ESP8266_Light: 390, ESP32_Temp: 790, ESP32_Humi: 365, ESP32_Light: 340 },
];

const SAMPLE_SENSOR_SERIES = [
  { key: 'ESP8266_Temp', label: 'ESP8266 Temp', color: '#16A085' },
  { key: 'ESP8266_Humi', label: 'ESP8266 Humi', color: '#2EAD4F' },
  { key: 'ESP8266_Light', label: 'ESP8266 Light', color: '#1F4E79' },
  { key: 'ESP32_Temp', label: 'ESP32 Temp', color: '#C0392B' },
  { key: 'ESP32_Humi', label: 'ESP32 Humi', color: '#7E57C2' },
  { key: 'ESP32_Light', label: 'ESP32 Light', color: '#D68910' },
];

const SENSOR_META = {
  temperature: { label: 'Temperature', colorKey: 'temperature', unit: 'C' },
  humidity: { label: 'Humidity', colorKey: 'humidity', unit: '%' },
  light: { label: 'Light', color: '#D9A441', unit: 'lux' },
  motion: { label: 'Motion', colorKey: 'motion', unit: '' },
};

const FALLBACK_SENSOR_COLORS = ['#5B8BD5', '#A86FD5', '#E67E22', '#2ECC71', '#E74C3C'];

function parseSensorValue(sensorKey, rawValue) {
  if (rawValue == null || rawValue === '') {
    return null;
  }

  if (sensorKey === 'motion') {
    if (typeof rawValue === 'boolean') {
      return rawValue ? 1 : 0;
    }

    const normalized = String(rawValue).trim().toLowerCase();
    if (['1', 'true', 'detected', 'motion', 'on'].includes(normalized)) {
      return 1;
    }
    if (['0', 'false', 'clear', 'off'].includes(normalized)) {
      return 0;
    }
  }

  const numericValue = Number.parseFloat(rawValue);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function transformHistoryToSeries(historyEntries) {
  const rowsByTimestamp = new Map();
  const discoveredSensors = new Set();

  historyEntries.forEach((entry) => {
    const timestamp = entry?.timestamp;
    const payload = entry?.data;

    if (!timestamp || !payload || typeof payload !== 'object') {
      return;
    }

    const row = rowsByTimestamp.get(timestamp) || {
      timestamp,
      time: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    Object.entries(payload).forEach(([sensorKey, rawValue]) => {
      const parsedValue = parseSensorValue(sensorKey, rawValue);

      if (parsedValue == null) {
        return;
      }

      row[sensorKey] = parsedValue;
      discoveredSensors.add(sensorKey);
    });

    rowsByTimestamp.set(timestamp, row);
  });

  return {
    chartData: Array.from(rowsByTimestamp.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    ),
    sensorKeys: Array.from(discoveredSensors),
  };
}

function buildChartSeriesFromLiveSensorData(sensorData) {
  if (!sensorData || typeof sensorData !== 'object') {
    return { chartData: [], sensorKeys: [] };
  }

  const seriesEntries = Object.entries(sensorData).filter(([, sensor]) => Array.isArray(sensor?.history));
  const sensorKeys = seriesEntries.map(([sensorKey]) => sensorKey);
  const maxPoints = Math.max(0, ...seriesEntries.map(([, sensor]) => sensor.history.length));

  const chartData = Array.from({ length: maxPoints }, (_, index) => {
    const row = {};

    seriesEntries.forEach(([sensorKey, sensor]) => {
      const point = sensor.history[index];

      if (!point) {
        return;
      }

      row.time = point.time || row.time || `${index + 1}`;
      row[sensorKey] = parseSensorValue(sensorKey, point.value);
    });

    return row;
  }).filter((row) => row.time);

  return { chartData, sensorKeys };
}

function getSensorStroke(sensorKey, colors, chartColors, index) {
  const sampleSeries = SAMPLE_SENSOR_SERIES.find((series) => series.key === sensorKey);

  if (sampleSeries?.color) {
    return sampleSeries.color;
  }

  const sensorMeta = SENSOR_META[sensorKey];

  if (sensorMeta?.color) {
    return sensorMeta.color;
  }

  if (sensorMeta?.colorKey && chartColors[sensorMeta.colorKey]) {
    return chartColors[sensorMeta.colorKey];
  }

  return FALLBACK_SENSOR_COLORS[index % FALLBACK_SENSOR_COLORS.length] || colors.accent;
}

function getSensorLabel(sensorKey) {
  return (
    SAMPLE_SENSOR_SERIES.find((series) => series.key === sensorKey)?.label
    || SENSOR_META[sensorKey]?.label
    || sensorKey
  );
}

export default function Analytics({ sensorData }) {
  const { isDark, colors, chartColors } = useTheme();
  const [history, setHistory] = useState([]);
  const [sensorKeys, setSensorKeys] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchHistory = async () => {
      try {
        const data = await api.get('/history?limit=24');
        if (!mounted) {
          return;
        }

        const transformed = transformHistoryToSeries(Array.isArray(data) ? data : []);
        const fallbackSeries = buildChartSeriesFromLiveSensorData(sensorData);
        const sampleSeries = {
          chartData: SAMPLE_MULTI_SENSOR_DATA,
          sensorKeys: SAMPLE_SENSOR_SERIES.map((series) => series.key),
        };
        const nextChartData = transformed.chartData.length > 0
          ? transformed.chartData
          : fallbackSeries.chartData.length > 0
            ? fallbackSeries.chartData
            : sampleSeries.chartData;
        const nextSensorKeys = transformed.sensorKeys.length > 0
          ? transformed.sensorKeys
          : fallbackSeries.sensorKeys.length > 0
            ? fallbackSeries.sensorKeys
            : sampleSeries.sensorKeys;

        setHistory(nextChartData);
        setSensorKeys(nextSensorKeys);
        setError('');
      } catch {
        if (mounted) {
          const fallbackSeries = buildChartSeriesFromLiveSensorData(sensorData);
          const nextChartData = fallbackSeries.chartData.length > 0 ? fallbackSeries.chartData : SAMPLE_MULTI_SENSOR_DATA;
          const nextSensorKeys = fallbackSeries.sensorKeys.length > 0
            ? fallbackSeries.sensorKeys
            : SAMPLE_SENSOR_SERIES.map((series) => series.key);

          setHistory(nextChartData);
          setSensorKeys(nextSensorKeys);
          setError(fallbackSeries.chartData.length > 0 ? '' : 'Showing sample sensor data while backend history is unavailable.');
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
  }, [sensorData]);

  const temperatureCurrent = sensorData?.temperature?.current ?? '--';
  const humidityCurrent = sensorData?.humidity?.current ?? '--';
  const primarySensorLabel = sensorKeys.length > 0
    ? getSensorLabel(sensorKeys[0])
    : 'Sensor';
  const chartTitle = sensorKeys.length > 0
    ? `${sensorKeys.length}-Sensor Dashboard`
    : 'Sensor Dashboard';

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
            {primarySensorLabel}
          </h1>
        </div>

        <div className="justify-self-start xl:justify-self-end">
          <p className="text-right text-[12px] uppercase tracking-[0.28em] transition-colors duration-300" style={{ color: colors.textSecondary }}>Current State</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-display text-[96px] font-semibold leading-none transition-colors duration-300" style={{ color: colors.text }}>{temperatureCurrent}</span>
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
              <p className="mt-2 text-[17px] transition-colors duration-300" style={{ color: colors.textSecondary }}>{chartTitle} on a shared time axis</p>
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
            ) : (
              <>
                {error && (
                  <div className="mb-3 text-center text-[13px]" style={{ color: '#9d6056' }}>
                    {error}
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={history}
                  margin={{ top: 16, right: 8, left: -24, bottom: 32 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke={isDark ? `${colors.border}66` : '#ecd9bc'}
                  />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: isDark ? colors.textSecondary : '#b49f83',
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fill: isDark ? colors.textSecondary : '#b49f83',
                      fontSize: 12,
                    }}
                  />
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
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ paddingTop: 16 }}
                  />
                  {sensorKeys.map((sensorKey, index) => {
                    const stroke = getSensorStroke(sensorKey, colors, chartColors, index);

                    return (
                      <Area
                        key={sensorKey}
                        type="monotone"
                        dataKey={sensorKey}
                        stroke={stroke}
                        fill={stroke}
                        fillOpacity={0.3}
                        strokeWidth={2.2}
                        dot={true}
                        activeDot={{ r: 6 }}
                        connectNulls
                        name={getSensorLabel(sensorKey)}
                      />
                    );
                  })}
                </AreaChart>
                </ResponsiveContainer>
              </>
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
                <p className="font-display mt-2 text-[58px] font-semibold leading-none transition-colors duration-300" style={{ color: colors.text }}>{humidityCurrent}<span className="text-[34px]" style={{ color: colors.accent }}>%</span></p>
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
