import { useCallback } from 'react'
import { initReactI18next, Trans as i18nTrans } from 'react-i18next'
import detector from 'i18next-browser-languagedetector'

import i18n, { defaultLanguage, supportedLanguages } from '@core/i18n/i18nFactory'

import * as DomUtils from '@webapp/utils/domUtils'

const browserI18n = i18n.use(detector).use(initReactI18next)

// set i18n language to browser language (English by default)
const browserLanguage = navigator.language ?? defaultLanguage
if (browserI18n.language !== browserLanguage && supportedLanguages.includes(browserLanguage)) {
  browserI18n.changeLanguage(browserLanguage)
}

export const useI18n = () => browserI18n

export const useI18nT = ({ unescapeHtml = false } = {}) =>
  useCallback(
    (textKey, textParams) => {
      const text = browserI18n.t(textKey, textParams)
      return unescapeHtml ? DomUtils.unescapeHtml(text) : text
    },
    [unescapeHtml]
  )

export const useI18nTrans = () => i18nTrans

export const useLang = () => browserI18n.language
