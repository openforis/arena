import { useCallback } from 'react'
import { initReactI18next } from 'react-i18next'
import detector from 'i18next-browser-languagedetector'

import i18nInstance, { defaultLanguage, supportedLanguages } from '@core/i18n/i18nFactory'

import { UILanguageStorage } from '@webapp/service/storage/uiLanguage'
import * as DomUtils from '@webapp/utils/domUtils'

const browserI18n = i18nInstance.use(detector).use(initReactI18next)

const getBrowserLanguageCode = () => (navigator.language ?? defaultLanguage).trim().split(/[-_]/)[0]

/**
 * Detects the UI language when the user has no preferred one: the one stored in the browser, otherwise the browser language.
 * @returns {string} The detected language code.
 */
export const detectUILanguage = () =>
  [UILanguageStorage.getUILanguage(), getBrowserLanguageCode()].find((lang) => supportedLanguages.includes(lang)) ??
  defaultLanguage

const detectedLanguage = detectUILanguage()
if (browserI18n.language !== detectedLanguage) {
  browserI18n.changeLanguage(detectedLanguage)
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

export const useLang = () => browserI18n.language
