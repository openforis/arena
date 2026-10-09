/**
 * Top-level mount point for the AI module. Registered once from
 * `server/system/apiRouter.js`; delegates to the per-area sub-APIs.
 *
 * Routes: `/ai/model` (gateway), `/ai/settings*`, `/ai/internal/*`,
 * `/survey/:surveyId/ai-policy`.
 */
import * as Log from '@server/log/log'

import * as CapabilityStatsApi from './capabilityStatsApi'
import * as InternalApi from './internalApi'
import * as ModelApi from './modelApi'
import * as SettingsApi from './settingsApi'
import * as SurveyAiPolicyApi from './surveyAiPolicyApi'

const logger = Log.getLogger('AiApi')

export const init = (app) => {
  ModelApi.init(app)
  SettingsApi.init(app)
  CapabilityStatsApi.init(app)
  InternalApi.init(app)
  SurveyAiPolicyApi.init(app)

  logger.info('AI module initialised (model, settings, capabilityStats, internal, surveyAiPolicy routes registered)')
}
