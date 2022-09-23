import i18n from 'i18next';
import {
  initReactI18next,
} from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import gb from 'date-fns/locale/en-GB';
import us from 'date-fns/locale/en-US';
import fr from 'date-fns/locale/fr';
import {
  registerLocale,
} from 'react-datepicker';

import translationEN from './locales/en/translation.json';
import translationFR from './locales/fr/translation.json';

// Variable for supported locales
registerLocale('en-GB', gb);
registerLocale('en-US', us);
registerLocale('fr', fr);

export const locales = {
  'en-GB': 'English (United Kingdom)',
  'en-US': 'English (United States)',
  fr: 'Français',
};

// the translations
export const lngs = {
  'en-US': {
    translation: translationEN,
  },
  'en-GB': {
    translation: translationEN,
  },
  fr: {
    translation: translationFR,
  },
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .use(LanguageDetector)
  .init({
    resources: lngs,
    fallbackLng: 'en', // use en if detected lng is not available
    // array of allowed languages
    supportedLngs: ['en', 'fr'],
    // if true, will consider variants as supported when the main language is. E.g. en-US will be valid if en is in supportedLngs.
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
