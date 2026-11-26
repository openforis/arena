import { renderToStaticMarkup } from 'react-dom/server'

import { AppIcon } from './AppIcon'
import { IconName } from './iconComponents'

const markupCache = new Map<string, string>()

// the MUI styles are injected by effects, which don't run here: the basic SVG styles are inline
const svgStyle = { width: '1em', height: '1em', fill: 'currentColor' }

/**
 * Returns the HTML of an icon, for code that builds HTML outside React (d3 charts, Leaflet markers).
 */
export const appIconMarkup = (name: IconName, size?: number): string => {
  const cacheKey = `${name}-${size ?? ''}`
  let html = markupCache.get(cacheKey)
  if (!html) {
    html = renderToStaticMarkup(<AppIcon name={name} size={size} style={svgStyle} />)
    markupCache.set(cacheKey, html)
  }
  return html
}
