import React, { createContext, useContext, useState, useEffect } from 'react';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';

// 获取系统语言
const getSystemLanguage = (): string => {
  const locale = getLocales()[0];
  const languageCode = locale?.languageCode?.toLowerCase() || 'zh';
  return languageCode === 'zh' ? 'zh' : 'en';
};

interface LanguageContextType {
  language: string;
  i18n: typeof i18n;
  toggleLanguage: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>(i18n.locale);

  useEffect(() => {
    const initLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem('language');
        const initialLanguage = storedLanguage || getSystemLanguage();
        setLanguage(initialLanguage);
        i18n.locale = initialLanguage;
      } catch (error) {
        console.error('初始化语言失败:', error);
        const fallbackLanguage = getSystemLanguage();
        setLanguage(fallbackLanguage);
        i18n.locale = fallbackLanguage;
      }
    };

    initLanguage();
  }, []);

  const toggleLanguage = async () => {
    try {
      const newLanguage = language === 'en' ? 'zh' : 'en';
      await AsyncStorage.setItem('language', newLanguage);
      i18n.locale = newLanguage;
      setLanguage(newLanguage);
    } catch (error) {
      console.error('切换语言失败:', error);
    }
  };

  // 确保 language 状态和 i18n.locale 保持同步
  useEffect(() => {
    if (i18n.locale !== language) {
      i18n.locale = language;
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, i18n, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default i18n; 