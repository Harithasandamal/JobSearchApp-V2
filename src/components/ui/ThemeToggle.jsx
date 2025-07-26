import React, { memo } from 'react';
import useTheme from '../../hooks/useTheme';

const ThemeToggle = ({ locked }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      className="theme-toggle-btn"
      onClick={locked ? undefined : toggleTheme}
      disabled={locked}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        border: 'none',
        background: isDark ? '#4dabf7' : '#ffd43b',
        color: isDark ? '#1a1a1a' : '#333333',
        cursor: locked ? 'default' : 'pointer',
        fontSize: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: locked ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.2)',
        transition: 'background 0.2s, color 0.2s, opacity 0.2s',
        opacity: locked ? 0.7 : 1,
        zIndex: 1000
      }}
      title={locked ? 'Theme cannot be changed after search starts' : `Switch to ${isDark ? 'light' : 'dark'} mode`}
      tabIndex={locked ? -1 : 0}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};

export default memo(ThemeToggle); 