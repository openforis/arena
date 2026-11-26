import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'

import { AppIcon } from './AppIcon'
import { IconName } from './iconComponents'

/**
 * Returns the HTML of an icon, for code that builds HTML outside React (Leaflet markers, d3 charts).
 */
export const appIconMarkup = (name: IconName, size?: number): string => {
  const container = document.createElement('div')
  const root = createRoot(container)
  flushSync(() => root.render(<AppIcon name={name} size={size} />))
  const html = container.innerHTML
  root.unmount()
  return html
}
