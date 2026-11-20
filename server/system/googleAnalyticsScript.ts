import type { Request, Response } from 'express'

import * as ProcessUtils from '@core/processUtils'

// Google tag IDs (e.g. G-XXXXXXXXXX): anything else is ignored, so the ID cannot inject code in the script
const googleAnalyticsIdRegex = /^[A-Z]{1,3}-[A-Z0-9]+$/i

const buildScript = (id: string): string => `window.dataLayer = window.dataLayer || []
function gtag() {
  dataLayer.push(arguments)
}
gtag('js', new Date())
gtag('config', '${id}')
var gtagScript = document.createElement('script')
gtagScript.async = true
gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=${id}'
document.head.appendChild(gtagScript)
`

/**
 * Serves the script loading Google Analytics; empty when GOOGLE_ANALYTICS_ID is not set (analytics disabled).
 * @param {Request} _req - The request.
 * @param {Response} res - The response.
 * @returns {void}
 */
export const googleAnalyticsScriptHandler = (_req: Request, res: Response): void => {
  const id = ProcessUtils.ENV.googleAnalyticsId?.trim()
  const script = id && googleAnalyticsIdRegex.test(id) ? buildScript(id) : ''
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')
  res.send(script)
}
