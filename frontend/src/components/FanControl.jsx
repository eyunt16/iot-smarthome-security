import React, { useState } from 'react';
import { Fan } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/DarkModeContext';

export default function FanControl({ initialSpeed = 0, onSpeedChange, disabled = false }) {
  const [speed, setSpeed] = useState(initialSpeed);
  const { isDark, colors } = useTheme();

  const handleSpeedChange = (e) => {
    if (disabled) {
      return;
    }

    const newSpeed = parseInt(e.target.value);
    setSpeed(newSpeed);
    if (onSpeedChange) onSpeedChange(newSpeed);
  };

  const getSpeedLabel = () => {
    if (speed === 0) return 'OFF';
    if (speed <= 33) return 'Low';
    if (speed <= 66) return 'Medium';
    return 'High';
  };

  const getIconStyle = () => {
    if (speed === 0) return {
      background: isDark ? '#5A5A5A' : '#9CA3AF',
    };
    if (speed <= 33) return {
      background: `linear-gradient(135deg, ${colors.sliderBlue}, ${colors.sliderBlue}CC)`,
      boxShadow: `0 4px 14px ${colors.sliderBlue}55`,
    };
    if (speed <= 66) return {
      background: `linear-gradient(135deg, ${colors.sliderPurple}, ${colors.sliderPurple}CC)`,
      boxShadow: `0 4px 14px ${colors.sliderPurple}55`,
    };
    return {
      background: `linear-gradient(135deg, ${colors.sliderBlue}, ${colors.sliderPurple})`,
      boxShadow: `0 4px 14px ${colors.sliderPurple}55`,
    };
  };

  const getAccentColor = () => {
    if (speed === 0) return '#9CA3AF';
    if (speed <= 33) return colors.sliderBlue;
    if (speed <= 66) return colors.sliderPurple;
    return colors.sliderBlue;
  };

  return (
    <motion.div 
      className="p-6 rounded-2xl border transition-all duration-300"
      style={{
        backgroundColor: isDark ? colors.card : '#FFFFFF',
        borderColor: colors.border,
      }}
      whileHover={{ y: -4, scale: 1.01, boxShadow: isDark
        ? '0 12px 32px rgba(0,0,0,0.2)'
        : '0 12px 32px rgba(155,124,84,0.1)' }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-full transition-all duration-300"
            style={getIconStyle()}
          >
            <motion.div
              animate={{ rotate: speed > 0 ? 360 : 0 }}
              transition={{ duration: 0.8, repeat: speed > 0 ? Infinity : 0 }}
            >
              <Fan size={24} className="text-white" />
            </motion.div>
          </div>
          <div>
            <h3 
              className="font-semibold transition-colors duration-300"
              style={{ color: colors.text }}
            >
              Ceiling Fan
            </h3>
            <p 
              className="text-sm transition-colors duration-300"
              style={{ color: colors.textSecondary }}
            >
              {getSpeedLabel()}
            </p>
          </div>
        </div>
        <span 
          className="text-2xl font-bold transition-colors duration-300"
          style={{ color: colors.text }}
        >
          {speed}%
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={speed}
        onChange={handleSpeedChange}
        disabled={disabled}
        className="w-full h-2 rounded-lg appearance-none transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          background: speed === 0
            ? (isDark ? '#5A4730' : '#D1D5DB')
            : `linear-gradient(to right, ${colors.sliderBlue}, ${colors.sliderPurple})`,
          accentColor: getAccentColor(),
        }}
      />
      <div 
        className="flex justify-between text-xs mt-2 transition-colors duration-300"
        style={{ color: colors.textSecondary }}
      >
        <span>Off</span>
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
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
