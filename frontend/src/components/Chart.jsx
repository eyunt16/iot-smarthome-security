import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from '../lib/recharts-shim.js';
import { useTheme } from '../contexts/DarkModeContext';

/**
 * Chart — full-size area chart used in Analytics and Environment pages.
 * Dark mode: soft muted-gold stroke, very low fill opacity, faint grid lines.
 * Light mode: warm forest-green stroke, tasteful opacity.
 */
export default function Chart({ data, dataKey, color, title }) {
  const { isDark, colors, chartColors } = useTheme();

  // In dark mode, override harsh neon colors with muted warm palette
  const strokeColor = isDark ? chartColors.primary : (color || chartColors.primary);
  const fillOpacity = chartColors.fillOpacity; // 0.12 dark / 0.25 light
  const gridStroke  = chartColors.gridStroke;

  return (
    <div
      className="p-6 h-full flex flex-col rounded-3xl border transition-all duration-300"
      style={{
        backgroundColor: isDark ? colors.card : '#FFFFFF',
        borderColor: colors.border,
      }}
    >
      <h3
        className="font-semibold mb-5 text-sm transition-colors duration-300"
        style={{ color: colors.textSecondary }}
      >
        {title}
      </h3>
      <div className="flex-1 w-full h-[300px] min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={strokeColor} stopOpacity={fillOpacity * 2} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Faint grid — nearly invisible in dark mode */}
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={gridStroke}
            />

            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? '#E8D5B7' : '#9ca3af', fontSize: 11 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: isDark ? '#E8D5B7' : '#9ca3af', fontSize: 11 }}
              width={36}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: chartColors.tooltipBg,
                backdropFilter: 'blur(8px)',
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                boxShadow: isDark
                  ? '0 8px 24px rgba(0, 0, 0, 0.4)'
                  : '0 4px 12px rgba(144, 116, 74, 0.1)',
                color: colors.text,
                fontSize: 12,
                padding: '8px 14px',
              }}
              cursor={{ stroke: strokeColor, strokeOpacity: 0.3, strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={strokeColor}
              strokeWidth={isDark ? 1.5 : 2.5}   /* thinner in dark — less harsh */
              fillOpacity={fillOpacity}
              fill={`url(#gradient-${dataKey})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: strokeColor, opacity: 0.85 }}
              isAnimationActive={true}
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
