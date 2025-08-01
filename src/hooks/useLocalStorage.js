import { useState, useEffect, useCallback } from 'react';

const useLocalStorage = (key, initialValue) => {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
      // Dispatch custom event to notify other hook instances in the same tab
      window.dispatchEvent(new CustomEvent('local-storage', { detail: { key, newValue: valueToStore } }));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Subscribe to storage and custom local-storage events to sync across hook instances
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
      const { key: eventKey, newValue } = event.detail;
      if (eventKey === key) {
        setStoredValue(newValue);
      }
    };
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('local-storage', handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('local-storage', handleCustomEvent);
    };
  }, [key, initialValue]);

  // Remove item from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Clear all localStorage
  const clearAll = useCallback(() => {
    try {
      window.localStorage.clear();
      setStoredValue(initialValue);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }, [initialValue]);

  return [storedValue, setValue, removeValue, clearAll];
};

export default useLocalStorage; 