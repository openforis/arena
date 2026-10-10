/**
 * Assistant areas: which tabs the panel shows, which are usable, which is selected.
 */
import type { AssistantPromptArea } from '@webapp/ai/agent/assistantSystemPrompt'
import type { AiEngineFeatureAvailability } from '@webapp/ai/engines/featureAvailability'
import type { AiFeatureAvailability } from '@webapp/ai/policy/aiFeatureAvailability'

export type AssistantArea = AssistantPromptArea

// tab order
export const assistantAreas: AssistantArea[] = ['design', 'analysis', 'cleaning', 'help']

export type AssistantAreaStatus = {
  area: AssistantArea
  status: 'hidden' | 'unavailable' | 'available'
  // i18n keys (common namespace) explaining why the area is unavailable
  reasonKeys: string[]
  // the engine availability behind an unavailable engine/policy status: the reasons with their actions (AiNotAvailable)
  engineAvailability?: AiEngineFeatureAvailability
}

/**
 * Returns a hidden status.
 * @param {AssistantArea} area - Area.
 * @returns {AssistantAreaStatus} The status.
 */
const hidden = (area: AssistantArea): AssistantAreaStatus => ({ area, status: 'hidden', reasonKeys: [] })

/**
 * Returns an unavailable status.
 * @param {AssistantArea} area - Area.
 * @param {string[]} reasonKeys - Reason i18n keys.
 * @returns {AssistantAreaStatus} The status.
 */
const unavailable = (area: AssistantArea, reasonKeys: string[]): AssistantAreaStatus => ({
  area,
  status: 'unavailable',
  reasonKeys,
})

/**
 * Maps the availability of a feature (B) to an area status.
 * @param {AssistantArea} area - Area.
 * @param {AiFeatureAvailability|AiEngineFeatureAvailability} availability - Feature availability.
 * @returns {AssistantAreaStatus} The status.
 */
export const fromAvailability = (
  area: AssistantArea,
  availability: AiFeatureAvailability | AiEngineFeatureAvailability
): AssistantAreaStatus => {
  const { status, reasonKeys = [] } = availability
  if (status === 'disabled') return hidden(area)
  if (status === 'available') return { area, status: 'available', reasonKeys: [] }
  const engineAvailability = 'reasons' in availability ? availability : undefined
  if (status === 'policyBlocked') {
    return {
      ...unavailable(area, reasonKeys.length > 0 ? reasonKeys : ['aiAssistant.unavailable.policy']),
      engineAvailability,
    }
  }
  // noEngine (C)
  return { ...unavailable(area, reasonKeys), engineAvailability }
}

/**
 * Returns the status of the Help area.
 * @param {object} params - Parameters.
 * @param {boolean} params.categoryEnabled - The user's "chat" AI category is on.
 * @param {AiFeatureAvailability} params.availability - Availability of the chatbot feature (B).
 * @returns {AssistantAreaStatus} The status.
 */
export const getHelpAreaStatus = ({
  categoryEnabled,
  availability,
}: {
  categoryEnabled: boolean
  availability: AiFeatureAvailability | AiEngineFeatureAvailability
}): AssistantAreaStatus => (categoryEnabled ? fromAvailability('help', availability) : hidden('help'))

/**
 * Returns the status of the Design area.
 * @param {object} params - Parameters.
 * @param {boolean} params.categoryEnabled - The user's "assistantDesign" AI category is on.
 * @param {boolean} params.surveyOpen - A survey is selected.
 * @param {boolean} params.canEditSurvey - The user can edit the survey.
 * @param {boolean} params.hasDraftSurvey - The draft survey definitions are loaded.
 * @param {AiFeatureAvailability} params.availability - Availability of the assistantDesign feature (B).
 * @returns {AssistantAreaStatus} The status.
 */
export const getDesignAreaStatus = ({
  categoryEnabled,
  surveyOpen,
  canEditSurvey,
  hasDraftSurvey,
  availability,
}: {
  categoryEnabled: boolean
  surveyOpen: boolean
  canEditSurvey: boolean
  hasDraftSurvey: boolean
  availability: AiFeatureAvailability | AiEngineFeatureAvailability
}): AssistantAreaStatus => {
  if (!categoryEnabled) return hidden('design')
  if (!surveyOpen) return unavailable('design', ['aiAssistant.unavailable.noSurvey'])
  if (!canEditSurvey) return unavailable('design', ['aiAssistant.unavailable.noPermission'])
  // the designer loads the draft definitions for editors only (survey/actions/active.js)
  if (!hasDraftSurvey) return unavailable('design', ['aiAssistant.unavailable.noSurvey'])
  return fromAvailability('design', availability)
}

/**
 * Returns true when the panel button is shown (at least one area not hidden).
 * @param {AssistantAreaStatus[]} statuses - Area statuses.
 * @returns {boolean} True when shown.
 */
export const isAssistantShown = (statuses: AssistantAreaStatus[]): boolean =>
  statuses.some((status) => status.status !== 'hidden')

/**
 * Picks the area to show.
 * @param {object} params - Parameters.
 * @param {AssistantAreaStatus[]} params.statuses - Area statuses.
 * @param {AssistantArea|null} params.current - Area shown now (kept only while the panel is open: it protects the
 * conversation on screen; a closed panel re-evaluates the area, so Design is picked when the user reaches the designer).
 * @param {boolean} params.panelOpen - The panel is open.
 * @param {AssistantArea|null} params.userSelectedArea - Tab the user clicked (until the panel closes).
 * @param {string|null} params.module - Current app module.
 * @param {boolean} [params.analysisRoute] - The route is the Explorer or the dashboard (Analysis is preferred there).
 * @param {boolean} [params.cleaningRoute] - The route is a cleaning view (Cleaning is preferred there, over Analysis).
 * @returns {AssistantArea|null} The area; null when every area is hidden.
 */
export const pickArea = ({
  statuses,
  current,
  panelOpen,
  userSelectedArea,
  module,
  analysisRoute = false,
  cleaningRoute = false,
}: {
  statuses: AssistantAreaStatus[]
  current: AssistantArea | null
  panelOpen: boolean
  userSelectedArea: AssistantArea | null
  module: string | null
  analysisRoute?: boolean
  cleaningRoute?: boolean
}): AssistantArea | null => {
  const isAvailable = (area: AssistantArea | null) =>
    area !== null && statuses.some((status) => status.area === area && status.status === 'available')
  const isShown = (area: AssistantArea | null) =>
    area !== null && statuses.some((status) => status.area === area && status.status !== 'hidden')
  // an unavailable tab the user clicked stays selected: it shows why
  if (isShown(userSelectedArea)) return userSelectedArea
  if (panelOpen && isAvailable(current)) return current
  const moduleArea: AssistantArea = module === 'designer' ? 'design' : 'help'
  let preferred: AssistantArea = moduleArea
  if (cleaningRoute && isAvailable('cleaning')) preferred = 'cleaning'
  else if (analysisRoute && isAvailable('analysis')) preferred = 'analysis'
  if (isAvailable(preferred)) return preferred
  const firstAvailable = statuses.find((status) => status.status === 'available')
  return (firstAvailable ?? statuses.find((status) => status.status !== 'hidden'))?.area ?? null
}

/**
 * Returns the app module and sub-module of a route (/app/<module>/<subModule>/…).
 * @param {string} pathname - Location pathname.
 * @returns {{module: string|null, subModule: string|null}} The names.
 */
export const parseAppPath = (pathname: string): { module: string | null; subModule: string | null } => {
  const [root, module = null, subModule = null] = pathname.split('/').filter(Boolean)
  return root === 'app' ? { module, subModule } : { module: null, subModule: null }
}
