import React, { useEffect, useState } from 'react';
import { Clock, Moon, Sun, Wifi, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { MqttsBadge } from './ui/MqttsBadge';
import { useTheme } from '../contexts/DarkModeContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const PAGE_TITLES = {
  dashboard:   { title: 'Smart Home Status',   sub: 'Security & Privacy · Tuyen Home Capstone' },
  security:    { title: 'Security Center',      sub: 'Intrusion detection · PIR motion · Biometric lock' },
  environment: { title: 'Environment Monitor',  sub: 'Real-time DHT11 sensor data · 24-hour trends' },
  profile:     { title: 'System Profile',       sub: 'Privacy settings · Encryption · Account' },
};

export default function Header({ activePage, isConnected }) {
  const [now, setNow] = useState(new Date());
  const { isDark, toggleTheme, colors } = useTheme();
  const isOnline = useNetworkStatus();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const { title, sub } = PAGE_TITLES[activePage] ?? PAGE_TITLES.dashboard;

  // Large, legible 12h time + date
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
  });
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  // Global accent (Forest Green / Muted Gold)
  const accent = isDark ? '#C8AA76' : '#1A4D2E';

  return (
    <header
      className="sticky top-0 z-30 flex flex-col gap-4 border-b px-8 py-7 backdrop-blur-md transition-all duration-300"
      style={{
        // Slightly translucent surface
        backgroundColor: isDark
          ? 'rgba(74,50,33,0.97)'
          : 'rgba(255,255,255,0.95)',
        borderColor: colors.border,
        boxShadow: isDark
          ? '0 4px 24px rgba(0,0,0,0.3)'
          : '0 4px 24px rgba(155,124,84,0.07)',
      }}
    >
      {/* ── Top row: Page title + Badges ── */}
      <div className="flex items-center justify-between gap-6">
        {/* Page title */}
        <div className="min-w-0 flex-1">
          <motion.h1
            className="font-display text-3xl font-bold leading-tight truncate transition-colors duration-300"
            style={{ color: colors.text }}
            key={title}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {title}
          </motion.h1>
          <motion.p
            className="text-sm mt-1 truncate transition-colors duration-300"
            style={{ color: colors.textSecondary }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            {sub}
          </motion.p>
        </div>

        {/* Right widgets */}
        <div className="flex items-center gap-2 shrink-0">
          {/* MCU Badge — explicitly "ESP32" */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-default"
            style={{
              borderColor: `${accent}55`,
              backgroundColor: isDark ? `${accent}14` : `${accent}0D`,
              color: accent,
            }}
            title="Microcontroller Unit — ESP8266"
          >
            ESP8266
          </motion.div>

          {/* MQTTS badge */}
          <MqttsBadge connected={isConnected} />

          {/* WiFi — dynamic navigator.onLine */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.96 }}
            className="p-2.5 rounded-2xl border transition-all duration-300 hover:shadow-md cursor-default"
            style={{
              borderColor: colors.border,
              backgroundColor: isDark ? 'rgba(90,71,48,0.4)' : '#FFFFFF',
            }}
            title={isOnline ? 'Network: Online' : 'Network: Offline'}
          >
            {isOnline ? (
              <Wifi    size={16} color={isDark ? '#7AC47A' : '#27AE60'} strokeWidth={2.2} />
            ) : (
              <WifiOff size={16} color="#EF4444" strokeWidth={2.2} />
            )}
          </motion.div>

          {/* Dark / Light mode toggle */}
          <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.1, rotate: 20 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-2xl border transition-all duration-300 hover:shadow-md"
            style={{
              borderColor: colors.border,
              backgroundColor: isDark ? 'rgba(90,71,48,0.4)' : '#FFFFFF',
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <Sun  size={16} color="#C8AA76" strokeWidth={2.2} />
            ) : (
              <Moon size={16} color="#1A4D2E" strokeWidth={2.2} />
            )}
          </motion.button>
        </div>
      </div>

      {/* ── Bottom row: Spacious Clock ── */}
      <motion.div
        className="flex items-center gap-5 rounded-2xl border px-6 py-4 transition-all duration-300 hover:shadow-lg cursor-default"
        style={{
          borderColor: colors.border,
          backgroundColor: isDark
            ? 'rgba(53,35,21,0.6)'
            : 'rgba(255,255,255,0.7)',
        }}
        whileHover={{ y: -2 }}
      >
        {/* Clock icon badge */}
        <div
          className="grid h-16 w-16 place-items-center rounded-2xl flex-shrink-0 transition-all duration-300"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(200,170,118,0.2), rgba(200,170,118,0.08))'
              : `linear-gradient(135deg, rgba(26,77,46,0.12), rgba(26,77,46,0.05))`,
          }}
        >
          <Clock size={28} color={accent} strokeWidth={2.0} />
        </div>

        {/* Time & Date */}
        <div>
          <p
            className="font-display text-5xl font-bold leading-none tracking-tight transition-colors duration-300"
            style={{ color: colors.text }}
          >
            {timeStr}
          </p>
          <p
            className="text-sm mt-2 uppercase tracking-widest font-semibold transition-colors duration-300"
            style={{ color: colors.textSecondary }}
          >
            {dateStr}
          </p>
        </div>
      </motion.div>
    </header>
  );
}
