import { useSelector } from 'react-redux'

import * as I18nState from './state'

export const useI18n = () => useSelector(I18nState.getState)
export const useLang = () => useSelector(I18nState.getLang)
