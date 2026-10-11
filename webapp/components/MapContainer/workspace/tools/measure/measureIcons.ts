// the mockup's quick button icons, in the toolbar text colour (an <img> cannot use currentColor)
const SVG_OPEN =
  '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f3138"' +
  ' stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">'

// a measuring stick (Measure distance); it replaces the PNG of the removed plugin
const MEASURE_DISTANCE_SVG = [
  SVG_OPEN,
  '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2"/><path d="m10 10 2 2"/><path d="m13 7 2 2"/>',
  '</svg>',
].join('')

// a polygon with its vertices
const MEASURE_AREA_SVG = [
  SVG_OPEN,
  '<path d="M5 7 12 4l8 5-2 10-12 1z" fill="#2f3138" fill-opacity="0.15"/>',
  '<circle cx="5" cy="7" r="1.6"/><circle cx="12" cy="4" r="1.6"/><circle cx="20" cy="9" r="1.6"/>',
  '<circle cx="18" cy="19" r="1.6"/><circle cx="6" cy="20" r="1.6"/>',
  '</svg>',
].join('')

/**
 * Turns an SVG document into an image URL.
 * @param {string} svg - The SVG markup.
 * @returns {string} The data URI.
 */
const toSvgDataUri = (svg: string): string => `data:image/svg+xml,${encodeURIComponent(svg)}`

export const measureDistanceIconSrc = toSvgDataUri(MEASURE_DISTANCE_SVG)
export const measureAreaIconSrc = toSvgDataUri(MEASURE_AREA_SVG)
