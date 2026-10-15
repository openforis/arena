/**
 * Engine of an assistant turn: the model, the step cap and prompt budget, and the hosting class the tools are
 * offered for. Pure (resolveModel is injected); runAssistantTurn and the panel use it.
 */
import type { AiDataClass, AiFeatureKey } from '@common/ai/features'
import type { AiHostingClass, AiPolicy } from '@common/ai/policy'

import type { ResolveModelParams } from './resolveModel'
import type { AiEngineLimits, AiSelectedEngine } from './types'

// the hosting class and the policy are set from the resolver (the ones the engine was selected with); only a caller
// that passes its own model (tests) can give them
type Access = { hostingClass?: AiHostingClass | null; effective?: AiPolicy | null }

export type AssistantEngine<TModel, TAccess extends object> = {
  model: TModel
  limits: AiEngineLimits
  access: TAccess & Access
  // null when the caller passed its own model (tests)
  engine: AiSelectedEngine | null
}

/**
 * Returns the model, limits and access of a turn: the caller's model as is, else the engine resolveModel selects
 * for the conversation's provider and data class (its limits; its hosting class and policy for the tools).
 * @param {object} params - Parameters.
 * @param {object} [params.model] - Model given by the caller (tests): used as is.
 * @param {AiEngineLimits} [params.limits] - Limits given by the caller (win over the engine's).
 * @param {AiEngineLimits} params.defaultLimits - Limits when neither the caller nor an engine gives them.
 * @param {object} params.access - The caller's access (policy inputs of the tools).
 * @param {AiFeatureKey} params.feature - Feature of the area.
 * @param {number} [params.surveyId] - Survey (none for Help).
 * @param {AiDataClass} params.dataClass - Data class of the conversation.
 * @param {string} [params.providerId] - Provider of the conversation (default: the user's default).
 * @param {AbortSignal} [params.signal] - Stop: closes a pending consent dialog.
 * @param {Function} params.resolve - resolveModel.
 * @returns {Promise<AssistantEngine>} The turn's engine.
 */
export const resolveAssistantEngine = async <TModel, TAccess extends object>({
  model,
  limits,
  defaultLimits,
  access,
  feature,
  surveyId,
  dataClass,
  providerId,
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
  providerId?: string
  signal?: AbortSignal
  resolve: (params: ResolveModelParams) => Promise<{ model: TModel; engine: AiSelectedEngine; policy?: AiPolicy }>
}): Promise<AssistantEngine<TModel, TAccess>> => {
  if (model) return { model, limits: limits ?? defaultLimits, access: access as TAccess & Access, engine: null }
  const resolved = await resolve({ feature, surveyId, dataClass, providerId, signal })
  return {
    model: resolved.model,
    limits: limits ?? resolved.engine.limits,
    // the tools are offered by the policy the engine was selected with, not by one read earlier
    access: {
      ...access,
      hostingClass: resolved.engine.hostingClass,
      ...(resolved.policy ? { effective: resolved.policy } : {}),
    },
    engine: resolved.engine,
  }
}
