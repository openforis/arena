import type { NextFunction, Request, Response } from 'express'

// only Arena pages can embed the preview: other sites could push their own survey into it (served by the Arena origin)
const contentSecurityPolicy = "frame-ancestors 'self'"

const isHtmlPage = (path: string): boolean => path.endsWith('/') || path.endsWith('.html')

/**
 * Restricts the Arena Mobile web preview (served under /mobile-preview) to its use in the survey designer:
 * it can be embedded only by Arena pages and its pages are served only in preview mode (not the full mobile app).
 * @param {Request} req - The request.
 * @param {Response} res - The response.
 * @param {NextFunction} next - The next function.
 * @returns {void}
 */
export const mobilePreviewMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('Content-Security-Policy', contentSecurityPolicy)
  if (isHtmlPage(req.path) && req.query.preview !== '1') {
    res.sendStatus(404)
    return
  }
  next()
}
