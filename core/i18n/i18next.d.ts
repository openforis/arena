import 'i18next'

// Translations are not typed: keep the i18next 26 t() types, where the options are optional
declare module 'i18next' {
  interface CustomTypeOptions {
    strictInterpolationChecks: false
  }
}
