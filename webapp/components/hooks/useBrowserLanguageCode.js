export const useBrowserLanguageCode = () => {
  const locale = navigator.language
  return locale.trim().split(/-|_/)[0]
}
