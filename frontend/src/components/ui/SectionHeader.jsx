import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/DarkModeContext';

/**
 * SectionHeader — shared across all page views.
 *
 * Theme-aware:
 *   Light: Forest Green (#1A4D2E) icon & title, warm cream icon badge
 *   Dark:  Muted Gold (#C8AA76) icon & title, gold-tinted icon badge
 */
export function SectionHeader({ icon: Icon, title, subtitle }) {
  const { isDark, colors } = useTheme();
  const accent = isDark ? '#C8AA76' : '#1A4D2E';
  const iconBg = isDark
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
