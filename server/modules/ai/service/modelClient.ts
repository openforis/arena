/**
 * Model calls made by the server (the admin ping): `generateStructured` returns an object validated against a zod
 * schema. The call checks the feature gate and the prompt size, resolves the model, checks the survey AI policy
 * (before the provider is called), runs under the model-call timeout and records telemetry.
 */
import type { LanguageModelV4 } from '@ai-sdk/provider'
import { generateObject } from 'ai'
import type { ZodType } from 'zod'
import type { User } from '@openforis/arena-core'

import { ENV } from '@core/processUtils'
import SystemError from '@core/systemError'
import { getAiFeature } from '@common/ai/features'
import { ARENA_DEFAULT_PROVIDER_ID } from '@common/ai/providerIds'

import * as Log from '@server/log/log'

import * as AiTelemetry from './aiTelemetry'
import { assertFeatureEnabled } from './featureGate'
import { formatErrorForLog, toAiSystemError } from './gateway/errorMapping'
import { assertPolicyAllows, type AiPolicyCheck } from './gateway/policy'
import * as ProviderResolver from './providerResolver'
import type { ProviderMeta } from './providerResolver'

const logger = Log.getLogger('AiModelClient')

type ArenaUser = User

export type ModelClientDeps = {
  resolveModel: (args: { user: ArenaUser; feature: string }) => Promise<{ model: LanguageModelV4; meta: ProviderMeta }>
  assertPolicyAllows: (check: AiPolicyCheck) => Promise<void>
  gateEnv: Parameters<typeof assertFeatureEnabled>[2]
}

const assertPromptSize = (prompt: string, system: string | undefined, feature: string): void => {
  const total = (prompt?.length || 0) + (system?.length || 0)
  if (total > ENV.aiMaxPromptChars) {
    throw new SystemError('aiPromptTooLarge', { feature, size: total, limit: ENV.aiMaxPromptChars })
  }
}

const buildContext = ({ user, feature, meta }: { user: ArenaUser; feature: string; meta: ProviderMeta }) => ({
  feature,
  source: meta.source,
  provider: meta.provider,
  model: meta.model,
  userUuid: user.uuid,
})

/**
 * Runs a model call with telemetry, under the timeout of model calls and the cancellation signal of the caller. A
 * failure is sent on as an error key: what the provider or the network said goes to the server log only.
 * @param {object} args - Args.
 * @param {object} args.ctx - Telemetry context.
 * @param {AbortSignal} [args.signal] - Cancellation signal of the caller.
 * @param {(abortSignal: AbortSignal) => Promise<T>} args.call - Makes the call, with the signal that stops it.
 * @returns {Promise<T>} The result of the call.
 * @throws {SystemError} An error key (`aiRequestTimeout` when the timeout stopped the call).
 */
const callModel = async <T>({
  ctx,
  signal,
  call,
}: {
  ctx: ReturnType<typeof buildContext>
  signal?: AbortSignal
  call: (abortSignal: AbortSignal) => Promise<T>
}): Promise<T> => {
  const timeout = AbortSignal.timeout(ENV.aiRequestTimeoutMs)
  const abortSignal = signal ? AbortSignal.any([signal, timeout]) : timeout
  try {
    return await AiTelemetry.track(ctx, () => call(abortSignal))
  } catch (error) {
    // the caller cancelled: nobody waits for an error key
    if (signal?.aborted) throw error
    if (!(error instanceof SystemError)) logger.warn(formatErrorForLog(ctx.feature, error))
    throw toAiSystemError(error, { timedOut: timeout.aborted })
  }
}

/**
 * Production dependencies; tests pass their own. The server's own calls use Arena default: the resolver refuses a call
 * without a provider id.
 * @returns {ModelClientDeps} The dependencies.
 */
export const createDefaultModelClientDeps = (): ModelClientDeps => ({
  resolveModel: ({ user, feature }) =>
    ProviderResolver.resolveModelForUser({ user, feature, providerId: ARENA_DEFAULT_PROVIDER_ID }),
  assertPolicyAllows,
  gateEnv: undefined, // featureGate defaults to ENV
})

// null means "no survey" (ceilings only); undefined means a caller was not updated for the survey AI policy
const assertSurveyIdGiven = (surveyId: number | null | undefined, feature: string): void => {
  if (surveyId === undefined) {
    throw new Error(`ModelClient: surveyId is required for feature ${feature} (pass null when there is no survey)`)
  }
}

const prepareModel = async (
  { user, feature, surveyId }: { user: ArenaUser; feature: string; surveyId: number | null },
  deps: ModelClientDeps
) => {
  const { model, meta } = await deps.resolveModel({ user, feature })
  await deps.assertPolicyAllows({
    surveyId: surveyId === null ? null : Number(surveyId),
    // unknown features get the stricter class
    dataClass: getAiFeature(feature)?.dataClass ?? 'data',
    hostingClass: meta.hostingClass ?? null,
  })
  return { model, meta }
}

/**
 * Structured generation: the output is validated against the zod schema.
 * @param {object} args - Args.
 * @param {object} args.user - Arena user.
 * @param {string} args.feature - Feature key.
 * @param {number|null} args.surveyId - Survey whose content is sent (null when there is none).
 * @param {string} args.prompt - User prompt.
 * @param {string} [args.system] - Optional system prompt.
 * @param {ZodType} args.schema - Zod schema describing the desired object.
 * @param {AbortSignal} [args.signal] - Optional cancellation signal (the timeout of model calls applies too).
 * @param {ModelClientDeps} [deps] - Dependencies (tests).
 * @returns {Promise<{object: *, usage: object, finishReason: string}>} AI SDK result.
 */
export const generateStructured = async (
  {
    user,
    feature,
    surveyId,
    prompt,
    system,
    schema,
    signal,
  }: {
    user: ArenaUser
    feature: string
    surveyId: number | null
    prompt: string
    system?: string
    schema: ZodType
    signal?: AbortSignal
  },
  deps: ModelClientDeps = createDefaultModelClientDeps()
) => {
  assertSurveyIdGiven(surveyId, feature)
  assertFeatureEnabled(feature, user, deps.gateEnv)
  assertPromptSize(prompt, system, feature)
  if (!schema) throw new SystemError('aiSchemaMissing', { feature })
  const { model, meta } = await prepareModel({ user, feature, surveyId }, deps)
  return callModel({
    ctx: buildContext({ user, feature, meta }),
    signal,
    call: (abortSignal) => generateObject({ model, prompt, system, schema, abortSignal }),
  })
}
