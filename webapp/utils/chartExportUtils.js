import { downloadToFile } from './domUtils'

const applyComputedStylesToSvg = (svgElement) => {
  // Clone the SVG to avoid modifying the original
  const clonedSvg = svgElement.cloneNode(true)

  // Get all elements from both original and cloned SVG
  const originalElements = svgElement.querySelectorAll('*')
  const clonedElements = clonedSvg.querySelectorAll('*')

  // Apply computed styles from original to cloned
  originalElements.forEach((originalEl, index) => {
    const clonedEl = clonedElements[index]
    if (!clonedEl) return

    const computedStyle = window.getComputedStyle(originalEl)

    // Apply important computed styles as inline attributes
    if (computedStyle.fill && !clonedEl.hasAttribute('fill')) {
      clonedEl.setAttribute('fill', computedStyle.fill)
    }
    if (computedStyle.stroke && !clonedEl.hasAttribute('stroke')) {
      clonedEl.setAttribute('stroke', computedStyle.stroke)
    }

    // For text elements, ensure they have a visible color
    if (clonedEl.tagName === 'text') {
      if (!clonedEl.hasAttribute('fill')) {
        const textFill = computedStyle.color || computedStyle.fill || '#000'
        clonedEl.setAttribute('fill', textFill)
      }

      if (computedStyle.fontSize) {
        clonedEl.setAttribute('font-size', computedStyle.fontSize)
      }
      if (computedStyle.fontFamily) {
        clonedEl.setAttribute('font-family', computedStyle.fontFamily)
      }
      if (computedStyle.fontWeight) {
        clonedEl.setAttribute('font-weight', computedStyle.fontWeight)
      }

      // Ensure text is not transparent
      const opacity = parseFloat(computedStyle.opacity || 1)
      if (opacity < 1 && opacity > 0) {
        clonedEl.setAttribute('opacity', opacity)
      } else if (opacity >= 1) {
        clonedEl.removeAttribute('opacity')
      }
    }

    if (computedStyle.opacity && computedStyle.opacity !== '1') {
      clonedEl.setAttribute('opacity', computedStyle.opacity)
    }
  })

  return clonedSvg
}

const drawLegendTextOnCanvas = (ctx, wrapperElement, minX, minY) => {
  // Find all legend items and draw them on the canvas
  const legendItems = wrapperElement.querySelectorAll('.recharts-legend-item')

  legendItems.forEach((item) => {
    const rect = item.getBoundingClientRect()
    const x = rect.x - minX
    const y = rect.y - minY

    // Try to find text in various possible locations
    let textContent = ''
    let textColor = '#000'
    let fontSize = '12px'
    let fontFamily = 'Arial'

    // Check for text SVG element
    const svgText = item.querySelector('text')
    if (svgText) {
      textContent = svgText.textContent || ''
      const style = window.getComputedStyle(svgText)
      textColor = style.fill || style.color || '#000'
      fontSize = style.fontSize || '12px'
      fontFamily = style.fontFamily || 'Arial'
    }

    // Check for span or other HTML text elements
    if (!textContent) {
      const span = item.querySelector('span')
      if (span) {
        textContent = span.textContent || ''
        const style = window.getComputedStyle(span)
        textColor = style.color || '#000'
        fontSize = style.fontSize || '12px'
        fontFamily = style.fontFamily || 'Arial'
      }
    }

    // If still no text, try to get direct text content
    if (!textContent) {
      textContent = item.textContent || ''
    }

    if (textContent.trim()) {
      // Draw legend indicator (colored box)
      const indicator = item.querySelector('.recharts-legend-item-marker')
      if (indicator) {
        const indRect = indicator.getBoundingClientRect()
        const indX = indRect.x - minX
        const indY = indRect.y - minY
        const indWidth = indRect.width
        const indHeight = indRect.height

        const indStyle = window.getComputedStyle(indicator)
        const indColor = indStyle.color || indStyle.backgroundColor || '#8884d8'
        ctx.fillStyle = indColor
        ctx.fillRect(indX, indY, indWidth, indHeight)
      }

      // Draw text
      ctx.font = `${fontSize} ${fontFamily}`
      ctx.fillStyle = textColor
      ctx.fillText(textContent.trim(), x + 30, y + 15)
    }
  })
}

export const downloadMultipleSvgsToPng = (svgElements, wrapperElement) => {
  const wrapperRect = wrapperElement.getBoundingClientRect()

  // Calculate the combined bounding box of all SVGs
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  svgElements.forEach((svgElement) => {
    const svgRect = svgElement.getBoundingClientRect()
    minX = Math.min(minX, svgRect.x)
    minY = Math.min(minY, svgRect.y)
    maxX = Math.max(maxX, svgRect.right)
    maxY = Math.max(maxY, svgRect.bottom)
  })

  // Also include legend in bounds calculation
  const legendWrapper = wrapperElement.querySelector('.recharts-legend-wrapper')
  if (legendWrapper) {
    const legendRect = legendWrapper.getBoundingClientRect()
    minX = Math.min(minX, legendRect.x)
    minY = Math.min(minY, legendRect.y)
    maxX = Math.max(maxX, legendRect.right)
    maxY = Math.max(maxY, legendRect.bottom)
  }

  // Fallback to wrapper bounds if no SVGs found
  if (!isFinite(minX)) {
    minX = wrapperRect.x
    minY = wrapperRect.y
    maxX = wrapperRect.right
    maxY = wrapperRect.bottom
  }

  const canvasWidth = Math.ceil(maxX - minX)
  const canvasHeight = Math.ceil(maxY - minY)

  const canvas = document.createElement('canvas')
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext('2d')

  // Fill canvas with white background
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  let imagesLoaded = 0
  const images = []
  const blobUrls = []

  svgElements.forEach((svgElement, index) => {
    // Apply computed styles to the cloned SVG
    const styledSvg = applyComputedStylesToSvg(svgElement)

    const serializer = new XMLSerializer()
    const svgString = serializer.serializeToString(styledSvg)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    blobUrls.push(url)

    const img = new Image()
    img.src = url
    img.onload = () => {
      const svgRect = svgElement.getBoundingClientRect()
      const x = svgRect.x - minX
      const y = svgRect.y - minY

      images[index] = { img, x, y }
      imagesLoaded += 1

      // Once all images are loaded, composite them onto the canvas
      if (imagesLoaded === svgElements.length) {
        images.forEach(({ img: loadedImg, x: posX, y: posY }) => {
          if (loadedImg) {
            ctx.drawImage(loadedImg, posX, posY)
          }
        })

        // Draw legend text on canvas
        drawLegendTextOnCanvas(ctx, wrapperElement, minX, minY)

        const pngUrl = canvas.toDataURL('image/png')
        downloadToFile(pngUrl, 'chart.png')

        // Clean up URLs
        blobUrls.forEach((blobUrl) => {
          URL.revokeObjectURL(blobUrl)
        })
      }
    }
  })
}
