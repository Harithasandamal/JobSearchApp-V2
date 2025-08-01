import { useState, useEffect, useCallback } from 'react';
import useLocalStorage from './useLocalStorage';
import useWorkflowLogger from './useWorkflowLogger';

const useTheme = () => {
  const [theme, setTheme] = useLocalStorage('theme', 'dark'); // ✅ Default to dark theme
  const [isDark, setIsDark] = useState(theme === 'dark');
  const [locked, setLocked] = useState(false);
  const workflowLogger = useWorkflowLogger();

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
    const themeIcon = newTheme === 'dark' ? '🌙' : '🌞';
    
    // ✅ Instant logging when theme is toggled
    workflowLogger.logAction('Theme toggled', `${themeIcon} Switched to ${newTheme} mode`);
    
    setTheme(newTheme);
    setIsDark(newTheme === 'dark');
    applyTheme(newTheme);
  }, [theme, setTheme, applyTheme, workflowLogger]);

  // Set specific theme
  const setSpecificTheme = useCallback((newTheme) => {
    const themeIcon = newTheme === 'dark' ? '🌙' : '🌞';
    
    // ✅ Instant logging when theme is set programmatically
    if (newTheme !== theme) {
      workflowLogger.logAction('Theme set', `${themeIcon} Changed to ${newTheme} mode programmatically`);
    }
    
    setTheme(newTheme);
    setIsDark(newTheme === 'dark');
    applyTheme(newTheme);
  }, [theme, setTheme, applyTheme, workflowLogger]);

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