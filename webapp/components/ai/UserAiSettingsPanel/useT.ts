/**
 * A translation function that returns a string, for the helpers that take a plain function.
 */
import { useMemo } from 'react'

import { useI18n } from '@webapp/store/system'

import { type TFunction, toT } from './aiSettingsForm'

/**
 * Returns the translation function of the current language.
 * @returns {TFunction} The translation function.
 */
export const useT = (): TFunction => {
  const i18n = useI18n()
  return useMemo(() => toT(i18n), [i18n])
}
