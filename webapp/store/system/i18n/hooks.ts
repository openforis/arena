import { useCallback } from 'react'

import { defaultLanguage, supportedLanguages } from '@core/i18n/uiLanguages'
import { UILanguageStorage } from '@webapp/service/storage/uiLanguage'
import * as DomUtils from '@webapp/utils/domUtils'

import i18nInstance from './i18nInstance'

const browserI18n = i18nInstance

const getBrowserLanguageCode = () => (navigator.language ?? defaultLanguage).trim().split(/[-_]/)[0]

/**
 * Detects the UI language when the user has no preferred one: the one stored in the browser, otherwise the browser language.
 * @returns {string} The detected language code.
 */
export const detectUILanguage = () =>
  [UILanguageStorage.getUILanguage(), getBrowserLanguageCode()].find((lang) => supportedLanguages.includes(lang)) ??
  defaultLanguage

/**
 * Resolves when the detected UI language is loaded (the UI is rendered after it, to avoid a flash of English).
 */
export const i18nReady: Promise<unknown> = browserI18n.changeLanguage(detectUILanguage()).catch(() => null)

export const useI18n = () => browserI18n

export const useI18nT = ({ unescapeHtml = false }: { unescapeHtml?: boolean } = {}) =>
  useCallback(
    (textKey: string, textParams?: Record<string, unknown>): string => {
      const text = browserI18n.t(textKey, textParams)
      return unescapeHtml ? DomUtils.unescapeHtml(text) : text
    },
    [unescapeHtml]
  )

export const useLang = () => browserI18n.language
