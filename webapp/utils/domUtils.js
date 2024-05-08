export const elementOffset = (el) => {
  if (el) {
    const rect = el.getBoundingClientRect()

    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop

    return {
      height: rect.height,
      width: rect.width,
      x: rect.x,
      y: rect.y,
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
    }
  }

  return {}
}

export const clickedOutside = (el, evt) => !el.contains(evt.target)

export const getViewportDimensions = () => ({
  width: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
  height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
})

export const isElementInViewport = (el) => {
  const rect = el.getBoundingClientRect()
  const viewportDim = getViewportDimensions()

  return rect.top >= 0 && rect.left >= 0 && rect.bottom <= viewportDim.height && rect.right <= viewportDim.width
}

export const dispatchWindowResize = () => {
  window.dispatchEvent(new Event('resize'))
}

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // ignore it
    return false
  }
}
