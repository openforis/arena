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
  } catch {
    // clipboard not available or permission denied
    return false
  }
}

export const downloadToFile = (url, outputFileName) => {
  const link = document.createElement('a')
  link.href = url
  link.download = outputFileName
  document.body.appendChild(link)
  link.click()
  link.remove()
}

export const downloadBlobToFile = (blob, outputFileName) => {
  const downloadUrl = URL.createObjectURL(blob)
  downloadToFile(downloadUrl, outputFileName)
  URL.revokeObjectURL(downloadUrl)
}

export const downloadTextToFile = (text, outputFileName) => {
  const blob = new Blob([text], { type: 'text/plain' })
  downloadBlobToFile(blob, outputFileName)
}

export const downloadSvgToPng = (svgElement) => {
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svgElement)
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  // Create an Image element
  const img = new Image()
  img.src = url
  img.onload = () => {
    // Create a canvas element
    const canvas = document.createElement('canvas')
    canvas.width = svgElement.clientWidth
    canvas.height = svgElement.clientHeight
    const ctx = canvas.getContext('2d')

    // Draw the image onto the canvas
    ctx.drawImage(img, 0, 0)

    // Create a download link for the canvas image
    const pngUrl = canvas.toDataURL('image/png')
    downloadToFile(pngUrl, 'chart.png')
    URL.revokeObjectURL(url)
  }
}

export const htmlToString = (html) => {
  try {
    const div = document.createElement('div')
    div.setHTMLUnsafe(html)
    return div.innerText
  } catch {
    // not parsable as HTML: return the original html
    return html
  }
}

export const unescapeHtml = (text) => {
  try {
    const doc = new DOMParser().parseFromString(text, 'text/html')
    return doc.documentElement.textContent
  } catch {
    // not parsable as HTML: return the original text
    return text
  }
}

export const extractPreElementContentFromHtml = (htmlText) => {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlText, 'text/html')
    const preContent = doc.querySelector('pre')?.innerText
    return preContent ? preContent.split('\u00A0')[0] : null
  } catch {
    return null
  }
}

const interactiveElementsSelector =
  'a, button, input, label, select, textarea, [contenteditable="true"], [role="button"], [role="checkbox"], [role="combobox"], [role="menuitem"], [role="option"]'

/**
 * Checks whether an event handled by a container (e.g. a table row) comes from a control inside it.
 * @param {{ currentTarget: Node, target: EventTarget }} event - The event (DOM or React).
 * @returns {boolean} True if the target is an interactive element (button, input...) inside the container,
 * or is outside the container DOM (React events bubble from portals, e.g. menus opened from the container).
 */
export const isEventFromInteractiveChild = (event) => {
  const { currentTarget } = event
  const target = /** @type {Element} */ (event.target)
  if (!currentTarget.contains(target)) return true
  const interactiveElement = target.closest(interactiveElementsSelector)
  return Boolean(interactiveElement) && interactiveElement !== currentTarget
}
