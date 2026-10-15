import type { AiDataClass } from '@common/ai/features'
import { appModuleUri, appModules, dataModules } from '@webapp/app/appModules'

import { isToolErrorOutput } from '@webapp/ai/agent/turnState'
import type { AiEngineFeatureAvailability } from '@webapp/ai/engines/featureAvailability'
import type { AiFeatureAvailability } from '@webapp/ai/policy/aiFeatureAvailability'

import { fromAvailability, type AssistantAreaStatus } from '../assistantAreas'

type Availability = AiFeatureAvailability | AiEngineFeatureAvailability

const analysisRoutePrefixes = [appModuleUri(dataModules.explorer), appModuleUri(appModules.dashboard)]

/**
 * Tells whether the path is a page where the Analysis area is selected automatically.
 * @param {string} pathname - Current path.
 * @returns {boolean} True for the Explorer and the dashboard.
 */
export const isAnalysisRoute = (pathname: string): boolean => {
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`
  return analysisRoutePrefixes.some((prefix) => normalized.startsWith(prefix))
}

/**
 * Returns the state of the Analysis tab.
 * @param {object} params - Parameters.
 * @param {boolean} params.surveyOpen - Whether a survey is open.
 * @param {boolean} params.canUseExplorer - Whether the user can use the Explorer.
 * @param {Availability} params.availability - Feature availability for the schema class.
 * @param {boolean} [params.canSwitchProvider] - A provider row can be picked in the chat.
 * @returns {AssistantAreaStatus} The tab state, (with the engine availability behind the reasons).
 */
export const getAnalysisAreaStatus = ({
  surveyOpen,
  canUseExplorer,
  availability,
  canSwitchProvider,
}: {
  surveyOpen: boolean
  canUseExplorer: boolean
  availability: Availability
  canSwitchProvider?: boolean
}): AssistantAreaStatus => {
  if (!surveyOpen || !canUseExplorer) return { area: 'analysis', status: 'hidden', reasonKeys: [] }
  return fromAvailability('analysis', availability, canSwitchProvider)
}

/**
 * Tells whether the policy forbids the conversation's provider to receive its record data.
 * An unreachable provider is not a policy lock: the error card and the switcher handle it.
 * @param {object} params - Parameters.
 * @param {AiDataClass} params.conversationDataClass - Conversation class.
 * @param {Availability} params.dataAvailability - Feature availability for the data class, with the conversation's provider.
 * @returns {boolean} True to show the "contains record data" notice.
 */
export const shouldShowRecordDataNotice = ({
  conversationDataClass,
  dataAvailability,
}: {
  conversationDataClass: AiDataClass
  dataAvailability: Availability
}): boolean =>
  // 'disabled' also covers capabilities not loaded yet: no notice until the availability is known
  conversationDataClass === 'data' && dataAvailability.status === 'policyBlocked'

/**
 * Returns the id of the query shown by a query_propose result.
 * @param {object} params - Parameters.
 * @param {string} params.toolName - Tool name.
 * @param {unknown} params.output - Tool output.
 * @returns {string|null} The query id, or null.
 */
export const getProposedQueryId = ({ toolName, output }: { toolName: string; output: unknown }): string | null => {
  if (toolName !== 'query_propose' || !output || typeof output !== 'object' || isToolErrorOutput(output)) return null
  const { queryId } = output as { queryId?: unknown }
  return typeof queryId === 'string' ? queryId : null
}
