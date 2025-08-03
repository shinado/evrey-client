import { I18n } from 'i18n-js';
import en from './translations/en';
import zh from './translations/zh';
import { getLocales } from 'expo-localization';

const translations = {
  en,
  zh
};

const i18n = new I18n(translations);

// Get system language
const locale = getLocales()[0];
const systemLanguage = locale?.languageCode?.toLowerCase() || 'zh';
const defaultLanguage = systemLanguage === 'zh' ? 'zh' : 'en';

// Set default locale and enable fallback
i18n.defaultLocale = defaultLanguage;
i18n.locale = defaultLanguage;
i18n.enableFallback = true;

export default i18n;
