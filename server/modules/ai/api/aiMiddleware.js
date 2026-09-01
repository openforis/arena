import { ENV } from '@core/processUtils'

/**
 * Rejects requests when the AI feature flag is off.
 * @param {object} req - Express request.
 * @param {object} res - Express response.
 * @param {Function} next - Express next middleware.
 */
export const requireAiFeaturesEnabled = (req, res, next) => {
  if (!ENV.aiFeaturesEnabled) {
    res.status(404).json({ error: 'aiFeaturesDisabled' })
    return
  }
  next()
}
