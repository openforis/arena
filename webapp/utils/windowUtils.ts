const openPopup = (url, target = '_blank') => {
  const windowFeatures = `scrollbars=no,status=no,location=no,toolbar=no,menubar=no`
  window.open(url, target, windowFeatures)
}

export const WindowUtils = {
  openPopup,
}
