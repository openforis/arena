import i18nInstance from '@core/i18n/i18nFactory'

export const stateKey = 'i18n'

export const keys = {
  lang: 'lang',
}

// ====== READ
export const getI18n = () => i18nInstance
export const getLang = () => i18nInstance.language
