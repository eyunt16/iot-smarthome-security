import React, { createContext, useContext, useState, useEffect } from 'react';
import { colors } from './colors';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const themeColors = isDark ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
