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

export const downloadToFile = (url, outputFileName) => {
  const link = document.createElement('a')
  link.href = url
  link.download = outputFileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const downloadTextToFile = (text, outputFileName) => {
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  downloadToFile(url, outputFileName)
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
  } catch (error) {
    return html
  }
}

export const unescapeHtml = (text) => {
  try {
    const doc = new DOMParser().parseFromString(text, 'text/html')
    return doc.documentElement.textContent
  } catch (ignored) {
    // ignore the error
  }
  return text
}
