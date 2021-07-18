import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next';
import * as I18nState from './state'

export const useI18n = useTranslation

export const useLang = () => useSelector(I18nState.getLang)
