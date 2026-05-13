import React from 'react';
import { Lock, WifiOff } from 'lucide-react';
import { useTheme } from '../../contexts/DarkModeContext';

/**
 * MqttsBadge — Encrypted connection status indicator.
 * connected=true → green pulsing dot (theme-aware)
 * connected=false → muted offline state (theme-aware)
 */
export function MqttsBadge({ connected }) {
  const { isDark, colors } = useTheme();

  return (
    <div
      className="flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition-all duration-300"
      style={
        connected
          ? {
              borderColor: isDark ? 'rgba(200,170,118,0.4)' : 'rgba(26,77,46,0.25)',
              backgroundColor: isDark ? 'rgba(200,170,118,0.1)' : 'rgba(26,77,46,0.06)',
              color: isDark ? '#C8AA76' : '#1A4D2E',
            }
          : {
              borderColor: colors.border,
              backgroundColor: isDark ? 'rgba(90,71,48,0.3)' : '#fdf6ec',
              color: colors.textSecondary,
            }
      }
    >
      {connected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
              style={{ backgroundColor: isDark ? '#C8AA76' : '#1A4D2E' }} />
            <span className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: isDark ? '#C8AA76' : '#1A4D2E' }} />
          </span>
          <Lock size={11} strokeWidth={2.4} />
          <span>MQTTS Encrypted · Port 8883</span>
        </>
      ) : (
        <>
          <WifiOff size={11} strokeWidth={2.2} />
          <span>Connecting to broker…</span>
        </>
      )}
    </div>
  );
}
