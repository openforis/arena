/**
 * Top-level mount point for the AI module. Registered once from
 * `server/system/apiRouter.js`; delegates to the per-area sub-APIs.
 *
 * Per-feature routes (translation, activity
 * log summary, data dictionary) are added in their respective phases.
 */
import * as Log from '@server/log/log'

import * as ChatbotApi from './chatbotApi'
import * as DataQueryApi from './dataQueryApi'
import * as InternalApi from './internalApi'
import * as ModelApi from './modelApi'
import * as SettingsApi from './settingsApi'

const logger = Log.getLogger('AiApi')

export const init = (app) => {
  ModelApi.init(app)
  SettingsApi.init(app)
  InternalApi.init(app)
  ChatbotApi.init(app)
  DataQueryApi.init(app)

  logger.info('AI module initialised (model, settings, internal, chatbot, dataQuery routes registered)')
}
