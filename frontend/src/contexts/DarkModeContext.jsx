import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('tuyen-theme-mode');
    if (saved !== null) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('tuyen-theme-mode', isDark ? 'dark' : 'light');
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      document.body.style.background = 'linear-gradient(180deg, #3A312B 0%, #332A24 100%)';
      document.body.style.color = '#E8E0D5';
    } else {
      html.classList.remove('dark');
      document.body.style.background = 'linear-gradient(180deg, #F8F6F0 0%, #F5F2ED 100%)';
      document.body.style.color = '#2C2A28';
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  const colors = {
    light: {
      // ── Light Mode — Warm Sanctuary with Forest Green ──────────
      bg:            '#F8F6F0',       // Cream background
      card:          '#FFFFFF',       // White surfaces/cards
      text:          '#2C2A28',       // Dark Charcoal — primary text
      textSecondary: '#7A6A58',       // Muted warm brown — secondary text
      accent:        '#1A4D2E',       // Forest Green — PRIMARY accent
      accentLight:   '#2D6A42',       // Lighter forest green
      accentBg:      '#E8F2EC',       // Green-tinted bg for active items
      border:        '#E8DECE',       // Warm cream border
      gold:          '#A68A64',       // Bronze/warm gold (support color)
      sliderYellow:  '#FFD700',
      sliderBlue:    '#5B8BD5',
      sliderPurple:  '#A86FD5',
    },
    dark: {
      // ── Dark Mode — Airy Dim Mode (Soft Warm Mocha) ─────────────
      bg:            '#3A312B',       // Soft Warm Mocha — NOT pitch black
      card:          '#4E4238',       // Elevated Soft Taupe
      text:          '#E8E0D5',       // Soft Oatmeal — readable, not harsh white
      textSecondary: '#A89F95',       // Muted warm grey-brown
      accent:        '#C5A880',       // Muted Warm Gold — PRIMARY accent
      accentLight:   '#D4B896',       // Lighter warm gold
      accentBg:      'rgba(197,168,128,0.15)', // Gold-tinted bg for active items
      border:        '#5C4D42',       // Warm dim border
      gold:          '#C5A880',       // Muted Warm Gold
      sliderYellow:  '#D4A84B',       // Dim warm yellow
      sliderBlue:    '#7A9EB8',       // Dim muted teal
      sliderPurple:  '#9E88A6',       // Dim muted purple
    }
  };

  const currentColors = isDark ? colors.dark : colors.light;

  // ── Chart colors — harmonious, NOT neon/harsh ──────────────────
  // Dark mode: desaturated, soft, muted. Low-contrast with brown bg.
  // Light mode: slightly richer but still warm and tasteful.
  const chartColors = {
    // Primary line — Muted Gold (dark) / Forest Green (light)
    primary:     isDark ? '#C8AA76' : '#1A4D2E',
    // Secondary line — warm beige (dark) / warm bronze (light)
    secondary:   isDark ? '#A89068' : '#8E6D4A',
    // Humidity/cool — muted teal (dark) / soft teal (light)
    humidity:    isDark ? '#7A9BA8' : '#4A7A9B',
    // Temperature — muted amber-brown (dark) / warm brown-orange (light)
    temperature: isDark ? '#BF9068' : '#C27B4A',
    // Alert/motion — muted red (dark) / stronger red (light)
    motion:      isDark ? '#B86060' : '#DC3C32',
    // Fill opacity: very low in dark to avoid harsh contrast
    fillOpacity: isDark ? 0.12 : 0.25,
    // Grid lines: near invisible in dark
    gridStroke:  isDark ? 'rgba(92,77,66,0.45)' : 'rgba(144,116,74,0.12)',
    // Tooltip bg
    tooltipBg:   isDark ? '#4E4238' : '#FFFAF4',
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors: currentColors, allColors: colors, chartColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
