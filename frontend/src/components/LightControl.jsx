import React, { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/DarkModeContext';

export default function LightControl({
  initialBrightness = 0,
  onBrightnessChange,
  disabled = false,
}) {
  const { isDark, colors } = useTheme();
  const [isOn, setIsOn] = useState(initialBrightness > 0);

  useEffect(() => {
    setIsOn(initialBrightness > 0);
  }, [initialBrightness]);

  const handleToggle = () => {
    if (disabled) {
      return;
    }

    const nextIsOn = !isOn;
    setIsOn(nextIsOn);
    onBrightnessChange?.(nextIsOn ? 100 : 0);
  };

  return (
    <motion.div
      className="rounded-2xl border p-6 transition-all duration-300"
      style={{
        backgroundColor: isDark ? colors.card : '#FFFFFF',
        borderColor: colors.border,
      }}
      whileHover={{
        y: -4,
        boxShadow: isDark
          ? '0 12px 32px rgba(0, 0, 0, 0.2)'
          : '0 12px 32px rgba(155, 124, 84, 0.1)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-full p-3 transition-all duration-300 ${
              isOn
                ? 'bg-gradient-to-br from-amber-400 to-yellow-500'
                : isDark
                  ? 'bg-stone-600'
                  : 'bg-gray-400'
            }`}
            style={isOn ? { boxShadow: '0 0 22px rgba(251, 191, 36, 0.45)' } : {}}
          >
            <motion.div
              animate={{ opacity: isOn ? 1 : 0.55, scale: isOn ? 1 : 0.96 }}
              transition={{ duration: 0.25 }}
            >
              <Lightbulb size={24} className="text-white" />
            </motion.div>
          </div>

          <div>
            <h3 className="font-semibold transition-colors duration-300" style={{ color: colors.text }}>
              Security Light
            </h3>
            <div className="mt-1 flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide ${
                  isOn
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isOn ? 'ON' : 'OFF'}
              </span>
              <span className="text-sm transition-colors duration-300" style={{ color: colors.textSecondary }}>
                Relay output
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          aria-label="Toggle security light"
          onClick={handleToggle}
          disabled={disabled}
          className={`relative inline-flex h-8 w-16 items-center rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
            isOn ? 'justify-end' : 'justify-start'
          }`}
          style={{
            backgroundColor: isOn ? (isDark ? colors.accent : '#F59E0B') : (isDark ? '#5C4D42' : '#D1D5DB'),
            borderColor: isOn ? 'transparent' : colors.border,
            paddingInline: '4px',
          }}
        >
          <span
            className="h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300"
          />
        </button>
      </div>

      <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8F6F0',
      }}>
        <span className="text-sm font-medium transition-colors duration-300" style={{ color: colors.textSecondary }}>
          Device State
        </span>
        <span
          className={`text-sm font-bold ${isOn ? 'text-emerald-500' : 'text-gray-400'}`}
        >
          {isOn ? 'ON' : 'OFF'}
        </span>
      </div>

      {disabled && (
        <p
          className="mt-3 text-[11px] font-medium transition-colors duration-300"
          style={{ color: colors.textSecondary }}
        >
          View only for customer accounts
        </p>
      )}
    </motion.div>
  );
}
