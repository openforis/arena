/**
 * Engine of an assistant turn: the model, the step cap and prompt budget, and the hosting class the tools are
 * offered for. Pure (resolveModel is injected); runAssistantTurn and the panel use it.
 */
import type { AiDataClass, AiFeatureKey } from '@common/ai/features'
import type { AiHostingClass } from '@common/ai/policy'
import type { AiDataLocation } from '@webapp/ai/policy/aiFeatureAvailability'

import { toDataLocation } from './featureAvailability'
import type { ResolveModelParams } from './resolveModel'
import type { AiEngineLimits, AiSelectedEngine } from './types'

type Access = { hostingClass: AiHostingClass | null }

export type AssistantEngine<TModel, TAccess extends Access> = {
  model: TModel
  limits: AiEngineLimits
  access: TAccess
  // null when the caller passed its own model (tests)
  engine: AiSelectedEngine | null
}

/**
 * Returns the model, limits and access of a turn: the caller's model as is, else the engine resolveModel selects
 * for the conversation's data class (its limits; its hosting class for the tools).
 * @param {object} params - Parameters.
 * @param {object} [params.model] - Model given by the caller (tests): used as is.
 * @param {AiEngineLimits} [params.limits] - Limits given by the caller (win over the engine's).
 * @param {AiEngineLimits} params.defaultLimits - Limits when neither the caller nor an engine gives them.
 * @param {object} params.access - The caller's access (policy inputs of the tools).
 * @param {AiFeatureKey} params.feature - Feature of the area.
 * @param {number} [params.surveyId] - Survey (none for Help).
 * @param {AiDataClass} params.dataClass - Data class of the conversation.
 * @param {AbortSignal} [params.signal] - Stop: closes a pending consent dialog.
 * @param {Function} params.resolve - resolveModel.
 * @returns {Promise<AssistantEngine>} The turn's engine.
 */
export const resolveAssistantEngine = async <TModel, TAccess extends Access>({
  model,
  limits,
  defaultLimits,
  access,
  feature,
  surveyId,
  dataClass,
  signal,
  resolve,
}: {
  model?: TModel
  limits?: AiEngineLimits
  defaultLimits: AiEngineLimits
  access: TAccess
  feature: AiFeatureKey
  surveyId?: number
  dataClass: AiDataClass
  signal?: AbortSignal
  resolve: (params: ResolveModelParams) => Promise<{ model: TModel; engine: AiSelectedEngine }>
}): Promise<AssistantEngine<TModel, TAccess>> => {
  if (model) return { model, limits: limits ?? defaultLimits, access, engine: null }
  const resolved = await resolve({ feature, surveyId, dataClass, signal })
  return {
    model: resolved.model,
    limits: limits ?? resolved.engine.limits,
    access: { ...access, hostingClass: resolved.engine.hostingClass },
    engine: resolved.engine,
  }
}

const sameLocation = (a: AiDataLocation, b: AiDataLocation): boolean =>
  a.hostingClass === b.hostingClass &&
  a.provider === b.provider &&
  a.model === b.model &&
  (a.engine ?? null) === (b.engine ?? null)

/**
 * Returns the location to announce ("Now using: …") when the engine changed since the previous turn, else null.
 * @param {object} params - Parameters.
 * @param {AiDataLocation|null} params.previous - Location of the previous turn (null: first turn of the panel).
 * @param {AiSelectedEngine} params.engine - Engine of this turn.
 * @returns {AiDataLocation|null} The new location, or null.
 */
export const getEngineChangeNotice = ({
  previous,
  engine,
}: {
  previous: AiDataLocation | null
  engine: AiSelectedEngine
}): AiDataLocation | null => {
  const current = toDataLocation(engine)
  return previous && !sameLocation(previous, current) ? current : null
}
