/**
 * Top-level mount point for the AI module. Registered once from
 * `server/system/apiRouter.js`; delegates to the per-area sub-APIs.
 *
 * Routes: `/ai/model` (gateway), `/ai/settings*`, `/ai/internal/*`.
 */
import * as Log from '@server/log/log'

import * as InternalApi from './internalApi'
import * as ModelApi from './modelApi'
import * as SettingsApi from './settingsApi'

const logger = Log.getLogger('AiApi')

export const init = (app) => {
  ModelApi.init(app)
  SettingsApi.init(app)
  InternalApi.init(app)

  logger.info('AI module initialised (model, settings, internal routes registered)')
}
