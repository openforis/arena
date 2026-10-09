import { appModuleUri, dataModules } from '@webapp/app/appModules'

import type { AiEngineFeatureAvailability } from '@webapp/ai/engines/featureAvailability'
import type { AiFeatureAvailability } from '@webapp/ai/policy/aiFeatureAvailability'

import { fromAvailability, type AssistantAreaStatus } from '../assistantAreas'

type Availability = AiFeatureAvailability | AiEngineFeatureAvailability

const cleaningRoutePrefixes = [
  dataModules.validationReport,
  dataModules.recordValidationReport,
  dataModules.record,
].map((module) => appModuleUri(module))

const explorerPrefix = appModuleUri(dataModules.explorer)

/**
 * Tells whether the current view is about cleaning data.
 * @param {object} params - Parameters.
 * @param {string} params.pathname - Current path.
 * @param {boolean} params.explorerEditMode - Whether the Explorer is in edit mode.
 * @returns {boolean} True for the validation report, the record editor and the Explorer in edit mode.
 */
export const isCleaningRoute = ({
  pathname,
  explorerEditMode,
}: {
  pathname: string
  explorerEditMode: boolean
}): boolean => {
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`
  if (cleaningRoutePrefixes.some((prefix) => normalized.startsWith(prefix))) return true
  return explorerEditMode && normalized.startsWith(explorerPrefix)
}

/**
 * Returns the state of the Cleaning tab.
 * @param {object} params - Parameters.
 * @param {boolean} params.surveyOpen - Whether a survey is open.
 * @param {boolean} params.canCleanseRecords - Whether the user can cleanse records.
 * @param {Availability} params.availability - Feature availability for the data class.
 * @returns {AssistantAreaStatus} The tab state, in D1's shape (with the engine availability behind the reasons).
 */
export const getCleaningAreaStatus = ({
  surveyOpen,
  canCleanseRecords,
  availability,
}: {
  surveyOpen: boolean
  canCleanseRecords: boolean
  availability: Availability
}): AssistantAreaStatus => {
  if (!surveyOpen || !canCleanseRecords) return { area: 'cleaning', status: 'hidden', reasonKeys: [] }
  return fromAvailability('cleaning', availability)
}

/**
 * Tells whether a new conversation of the area starts as `data` (its context already has record content).
 * @param {string} area - Assistant area.
 * @returns {boolean} True for the Cleaning area.
 */
export const startsAsDataConversation = (area: string): boolean => area === 'cleaning'
