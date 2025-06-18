export const useBrowserLanguageCode = () => {
  const locale = navigator.language ?? 'en'
  return locale.trim().split(/-|_/)[0]
}
