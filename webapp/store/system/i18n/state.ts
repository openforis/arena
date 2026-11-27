import i18nInstance from './i18nInstance'

export const stateKey = 'i18n'

export const keys = {
  lang: 'lang',
}

// ====== READ
export const getI18n = () => i18nInstance
export const getLang = () => i18nInstance.language
