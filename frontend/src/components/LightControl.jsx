import React, { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/DarkModeContext';

export default function LightControl({ initialBrightness = 0, onBrightnessChange, disabled = false }) {
  const [brightness, setBrightness] = useState(initialBrightness);
  const { isDark, colors } = useTheme();

  const handleBrightnessChange = (e) => {
    if (disabled) {
      return;
    }

    const newBrightness = parseInt(e.target.value);
    setBrightness(newBrightness);
    if (onBrightnessChange) onBrightnessChange(newBrightness);
  };

  const getBrightnessLabel = () => {
    if (brightness === 0) return 'OFF';
    if (brightness <= 33) return 'Dim';
    if (brightness <= 66) return 'Medium';
    return 'Bright';
  };

  return (
    <motion.div 
      className="p-6 rounded-2xl border transition-all duration-300"
      style={{
        backgroundColor: isDark ? colors.card : '#FFFFFF',
        borderColor: colors.border,
      }}
      whileHover={{ y: -4, boxShadow: isDark 
        ? '0 12px 32px rgba(0, 0, 0, 0.2)'
        : '0 12px 32px rgba(155, 124, 84, 0.1)'
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className={`p-3 rounded-full transition-all duration-300 ${
              brightness === 0 
                ? isDark ? 'bg-gray-600' : 'bg-gray-400'
                : 'bg-gradient-to-br from-yellow-300 to-yellow-500'
            }`}
            style={brightness > 0 ? {
              boxShadow: `0 0 20px rgba(255, 215, 0, ${brightness/100})`
            } : {}}
          >
            <motion.div
              animate={{ opacity: brightness > 0 ? 1 : 0.5 }}
              transition={{ duration: 0.3 }}
            >
              <Lightbulb size={24} className="text-white" />
            </motion.div>
          </div>
          <div>
            <h3 
              className="font-semibold transition-colors duration-300"
              style={{ color: colors.text }}
            >
              Security Light
            </h3>
            <p 
              className="text-sm transition-colors duration-300"
              style={{ color: colors.textSecondary }}
            >
              {getBrightnessLabel()}
            </p>
          </div>
        </div>
        <span 
          className="text-2xl font-bold transition-colors duration-300"
          style={{ color: colors.text }}
        >
          {brightness}%
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={brightness}
        onChange={handleBrightnessChange}
        disabled={disabled}
        className="w-full h-2 bg-gradient-to-r from-gray-300 to-yellow-400 rounded-lg appearance-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          accentColor: brightness === 0 ? '#d1d5db' : '#fbbf24'
        }}
      />
      <div 
        className="flex justify-between text-xs mt-2 transition-colors duration-300"
        style={{ color: colors.textSecondary }}
      >
        <span>Off</span>
        <span>Dim</span>
        <span>Medium</span>
        <span>Bright</span>
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
