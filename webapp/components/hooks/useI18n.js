import { useSelector } from 'react-redux'

import * as AppState from '@webapp/app/appState'

export const useI18n = () => useSelector(AppState.getI18n)
export const useLang = () => useSelector(AppState.getLang)
