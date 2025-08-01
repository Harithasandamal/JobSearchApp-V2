import { useState, useEffect, useCallback } from 'react';

/**
 * Session Storage Hook for temporary data (cleared on browser close)
 * Perfect for HTML/markdown content that should only persist during the session
 */
const useSessionStorage = (key, initialValue) => {
  // Get from session storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.sessionStorage) {
        return initialValue;
      }
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to sessionStorage
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // Only use sessionStorage in browser environment
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        // Dispatch custom event to notify other hook instances in the same tab
        window.dispatchEvent(new CustomEvent('session-storage', { detail: { key, newValue: valueToStore } }));
      }
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Subscribe to storage and custom session-storage events to sync across hook instances
  useEffect(() => {
    const handleStorageEvent = (event) => {
      if (event.key === key) {
        try {
          setStoredValue(event.newValue ? JSON.parse(event.newValue) : initialValue);
        } catch (e) {
          console.error(`Error parsing storage event newValue for key "${key}":`, e);
        }
      }
    };
    
    const handleCustomEvent = (event) => {
      if (event.detail.key === key) {
        setStoredValue(event.detail.newValue);
      }
    };

    // Listen for changes from other tabs/windows
    window.addEventListener('storage', handleStorageEvent);
    
    // Listen for changes from other hook instances in the same tab
    window.addEventListener('session-storage', handleCustomEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('session-storage', handleCustomEvent);
    };
  }, [key, initialValue]);

  // Remove item from sessionStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      window.sessionStorage.removeItem(key);
      window.dispatchEvent(new CustomEvent('session-storage', { detail: { key, newValue: initialValue } }));
    } catch (error) {
      console.error(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Clear all sessionStorage
  const clearStorage = useCallback(() => {
    try {
      window.sessionStorage.clear();
      setStoredValue(initialValue);
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
  }, [initialValue]);

  return [storedValue, setValue, removeValue, clearStorage];
};

export default useSessionStorage;