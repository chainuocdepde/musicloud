import React, { createContext, useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { storage } from '../utils/storage';
import '../i18n';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [loading, setLoading] = useState(true);

  // Load language from storage on mount
  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      setLoading(true);
      const savedLanguage = await storage.getLanguage();

      if (savedLanguage) {
        await i18n.changeLanguage(savedLanguage);
        setCurrentLanguage(savedLanguage);
      } else {
        // Default to English
        await i18n.changeLanguage('en');
        setCurrentLanguage('en');
      }
    } catch (error) {
      console.error('Error loading language:', error);
      await i18n.changeLanguage('en');
      setCurrentLanguage('en');
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = async (language) => {
    try {
      await i18n.changeLanguage(language);
      setCurrentLanguage(language);
      await storage.saveLanguage(language);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const value = {
    currentLanguage,
    loading,
    changeLanguage,
    isEnglish: currentLanguage === 'en',
    isVietnamese: currentLanguage === 'vi',
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
