import { useState, useEffect, useCallback } from 'react';
import useLocalStorage from './useLocalStorage';

const useTheme = () => {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [isDark, setIsDark] = useState(theme === 'dark');
  const [locked, setLocked] = useState(false);

  // Apply theme to document
  const applyTheme = useCallback((newTheme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }
  }, []);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    setIsDark(newTheme === 'dark');
    applyTheme(newTheme);
  }, [theme, setTheme, applyTheme]);

  // Set specific theme
  const setSpecificTheme = useCallback((newTheme) => {
    setTheme(newTheme);
    setIsDark(newTheme === 'dark');
    applyTheme(newTheme);
  }, [setTheme, applyTheme]);

  // Initialize theme on mount
  useEffect(() => {
    applyTheme(theme);
    setIsDark(theme === 'dark');
  }, [theme, applyTheme]);

  return {
    theme,
    isDark,
    toggleTheme,
    setTheme: setSpecificTheme,
    locked,
    setLocked
  };
};

export default useTheme; 