/**
 * Top-level mount point for the AI module. Registered once from
 * `server/system/apiRouter.js`; delegates to the per-area sub-APIs.
 *
 * Per-feature routes (translation, expression generate/explain, activity
 * log summary, data dictionary) are added in their respective phases.
 */
import * as Log from '@server/log/log'

import * as ActivityLogApi from './activityLogApi'
import * as ChatbotApi from './chatbotApi'
import * as ExpressionApi from './expressionApi'
import * as InternalApi from './internalApi'
import * as SettingsApi from './settingsApi'
import * as TranslationApi from './translationApi'

const logger = Log.getLogger('AiApi')

export const init = (app) => {
  SettingsApi.init(app)
  InternalApi.init(app)
  ExpressionApi.init(app)
  TranslationApi.init(app)
  ActivityLogApi.init(app)
  ChatbotApi.init(app)

  logger.info(
    'AI module initialised (settings, internal, expression, translation, activityLog, chatbot routes registered)'
  )
}
