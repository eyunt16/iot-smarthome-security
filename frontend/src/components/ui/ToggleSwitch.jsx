import React from 'react';
import { useTheme } from '../../contexts/DarkModeContext';

/**
 * ToggleSwitch — Global accent-aware toggle
 *
 * Light mode active: Forest Green  (#1A4D2E)
 * Dark mode active:  Muted Gold    (#C8AA76)
 *
 * @param {string}   id        aria / DOM id
 * @param {boolean}  checked   current state
 * @param {function} onChange  called with new boolean
 * @param {boolean}  disabled  greyed-out / non-interactive
 */
export function ToggleSwitch({ id, checked, onChange, disabled = false }) {
  const { isDark } = useTheme();

  // Active colour depends on theme
  const activeBg     = isDark ? '#C8AA76' : '#1A4D2E';
  const activeShadow = isDark
    ? '0 2px 10px rgba(200,170,118,0.45)'
    : '0 2px 10px rgba(26,77,46,0.40)';
  const activeBorder = isDark ? '#C8AA76' : '#1A4D2E';

  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className="relative h-7 w-14 rounded-full border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
      style={{
        borderColor: disabled
          ? '#d5ccc0'
          : checked ? activeBorder : (isDark ? '#5A4730' : '#d4c3a3'),
        backgroundColor: disabled
          ? (isDark ? '#3a2f25' : '#e8e2d9')
          : checked
            ? activeBg
            : (isDark ? '#3a2f25' : '#E8DECE'),
        boxShadow: checked && !disabled ? activeShadow : 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full transition-all duration-300"
        style={{
          transform: checked ? 'translateX(28px)' : 'translateX(0)',
          backgroundColor: disabled ? (isDark ? '#7a6a58' : '#c5bdb3') : '#FFFFFF',
          boxShadow: checked
            ? '0 2px 6px rgba(0,0,0,0.22)'
            : '0 1px 4px rgba(0,0,0,0.15)',
        }}
      />
    </button>
  );
}
