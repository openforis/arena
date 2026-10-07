import { Router } from 'express'

import * as ProcessUtils from '@core/processUtils'

/**
 * Registers the endpoint exposing the server config props not provided by arena-server's `/api/info`.
 *
 * @param {Router} router - The express router.
 */
export const init = (router: Router) => {
  router.get('/info/config', (_req, res) => {
    res.json({ activityLogDisabled: ProcessUtils.ENV.activityLogDisabled })
  })
}
