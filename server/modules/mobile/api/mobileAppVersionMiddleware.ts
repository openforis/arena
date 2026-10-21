import type { NextFunction, Request, Response } from 'express'

import { isMobileAppVersionNotSupported, mobileAppVersionHeader } from '@common/mobile'
import SystemError, { StatusCodes } from '@core/systemError'

/**
 * Rejects the requests sent by Arena Mobile app versions lower than the given one (or not sending their version).
 * @param {string} minVersion - Minimum supported app version.
 * @returns {Function} - The Express middleware.
 */
export const requireMobileAppMinVersion =
  (minVersion: string) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const appVersion = req.get(mobileAppVersionHeader)
    if (isMobileAppVersionNotSupported({ appVersion, minVersion })) {
      next(new SystemError('mobileAppVersionNotSupported', { appVersion, minVersion }, StatusCodes.UPGRADE_REQUIRED))
      return
    }
    next()
  }
