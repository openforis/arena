import i18n from '@core/i18n/i18nFactory'

export const stateKey = 'i18n'

export const keys = {
  lang: 'lang',
}

// ====== READ
export const getI18n = () => i18n
export const getLang = () => i18n.language
