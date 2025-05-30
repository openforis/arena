import detector from 'i18next-browser-languagedetector'
import { initReactI18next, Trans as i18nTrans } from 'react-i18next'

import i18n from '@core/i18n/i18nFactory'

const browserI18n = i18n.use(detector).use(initReactI18next)
browserI18n.changeLanguage(navigator.language)

export const useI18n = () => browserI18n

export const useI18nTrans = () => i18nTrans

export const useLang = () => browserI18n.language
