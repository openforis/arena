/**
 * Model and guard of a browser batch: the model an AI request of the feature gets today (resolveModel: engine
 * selection, local server consent, feature gate) and a guard that re-checks, before each call, that the feature and
 * the survey policy still allow that engine.
 */
import { type AiFeatureKey, getAiFeatureMinDataClass } from '@common/ai/features'
import type { AiGenerateText } from '@common/ai/llm'

import { resolveModel } from '@webapp/ai/engines/resolveModel'

import { createGatewayTextGenerator } from '../runtime/textGenerators'
import { type AiBatchGuard, createAiBatchGuard } from './batchRun'

export type AiBatchModel = { generateText: AiGenerateText; guard: AiBatchGuard }

/**
 * Resolves the model of a batch and creates its guard.
 * @param {object} params - Parameters.
 * @param {AiFeatureKey} params.feature - Feature key (translation, dataDictionary).
 * @param {number} params.surveyId - Survey id.
 * @param {AbortSignal} [params.signal] - Cancellation signal (closes a pending consent dialog).
 * @returns {Promise<AiBatchModel>} The text generator and the guard.
 */
export const resolveBatchModel = async ({
  feature,
  surveyId,
  signal,
}: {
  feature: AiFeatureKey
  surveyId: number
  signal?: AbortSignal
}): Promise<AiBatchModel> => {
  const { model, engine } = await resolveModel({ feature, surveyId, signal })
  // loaded lazily like the resolver's app wiring: it pulls in the HTTP client
  const { appBatchGuardDeps } = await import('./appBatchGuardDeps')
  const guard = createAiBatchGuard({
    feature,
    surveyId,
    dataClass: getAiFeatureMinDataClass(feature),
    hostingClass: engine.hostingClass,
    deps: appBatchGuardDeps,
  })
  return { generateText: createGatewayTextGenerator(model), guard }
}
