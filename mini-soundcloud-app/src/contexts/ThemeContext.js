import React, { createContext, useState, useContext, useEffect } from 'react';
import { Appearance } from 'react-native';
import { getTheme } from '../constants/theme';
import { storage } from '../utils/storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load theme from storage on mount
  useEffect(() => {
    loadTheme();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Only auto-switch if user hasn't set a preference
      storage.getTheme().then((savedTheme) => {
        if (!savedTheme) {
          setIsDark(colorScheme === 'dark');
        }
      });
    });

    return () => subscription.remove();
  }, []);

  const loadTheme = async () => {
    try {
      setLoading(true);
      const savedTheme = await storage.getTheme();

      if (savedTheme) {
        setIsDark(savedTheme === 'dark');
      } else {
        // Use system theme as default
        const systemTheme = Appearance.getColorScheme();
        setIsDark(systemTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
      // Default to system theme
      const systemTheme = Appearance.getColorScheme();
      setIsDark(systemTheme === 'dark');
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await storage.saveTheme(newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const setTheme = async (theme) => {
    try {
      const isDarkTheme = theme === 'dark';
      setIsDark(isDarkTheme);
      await storage.saveTheme(theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const theme = getTheme(isDark);

  const value = {
    isDark,
    theme,
    loading,
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
