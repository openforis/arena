/**
 * Core of `POST /api/ai/model`: a thin LanguageModelV4 proxy. Checks (feature gate, rate limit, call
 * validation), resolves the user's provider, forwards doGenerate / doStream with a timeout and client
 * disconnect abort, maps errors to stable keys and records telemetry exactly once per call.
 */
import type { LanguageModelV4, LanguageModelV4StreamPart } from '@ai-sdk/provider'
import type { User } from '@openforis/arena-core'

import { ENV } from '@core/processUtils'
import SystemError from '@core/systemError'
import type { AiGatewayCall } from '@common/ai/wire'
import { serializeGenerateResult, serializeStreamPart } from '@common/ai/wire'

import * as Log from '@server/log/log'
import * as Response from '@server/utils/response'
import {
  closeSseStream,
  createSseEventWriter,
  isSseClosed,
  openSseStream,
} from '@server/modules/ai/api/serverSentEvents'

import * as AiTelemetry from '../aiTelemetry'
import { assertFeatureEnabled } from '../featureGate'
import * as ProviderResolver from '../providerResolver'
import { parseGatewayRequest, sanitizeCall } from './callValidation'
import { assertPolicyAllows, type AiPolicyCheck } from './policy'
import { formatErrorForLog, toAiSystemError, toAiWireError } from './errorMapping'
import { createRateLimiter, type RateLimiter } from './rateLimiter'

const TOO_MANY_REQUESTS = 429

type TelemetryContext = { feature: string; source: string; provider: string; model: string; userUuid: string }

export type ModelGatewayDeps = {
  resolveModel: (args: { user: User; feature: string }) => Promise<{ model: LanguageModelV4; meta: any }>
  assertPolicyAllows: (check: AiPolicyCheck) => Promise<void>
  rateLimiter: RateLimiter
  recordTelemetry: (ctx: TelemetryContext, outcome: { latencyMs: number; usage?: unknown; error?: unknown }) => void
  logError: (message: string) => void
  limits: { maxPromptChars: number; maxOutputTokens: number; timeoutMs: number }
  gateEnv?: { aiFeaturesEnabled: boolean; aiFeatureFlags: unknown }
}

const logger = Log.getLogger('AiGateway')

/**
 * Builds the production dependencies (env limits, provider resolver, telemetry, log4js).
 * @returns {ModelGatewayDeps} The dependencies.
 */
export const createDefaultModelGatewayDeps = (): ModelGatewayDeps => ({
  resolveModel: ProviderResolver.resolveModelForUser,
  assertPolicyAllows,
  rateLimiter: createRateLimiter({ limitPerMinute: ENV.aiRateLimitPerMinute }),
  recordTelemetry: AiTelemetry.record,
  logError: (message) => logger.error(message),
  limits: {
    maxPromptChars: ENV.aiMaxPromptChars,
    maxOutputTokens: ENV.aiMaxOutputTokens,
    timeoutMs: ENV.aiRequestTimeoutMs,
  },
})

/**
 * Creates the abort controller of one call, aborted by the timeout or by the client going away.
 * @param {object} params - Parameters.
 * @param {object} params.res - Express response.
 * @param {number} params.timeoutMs - Timeout.
 * @returns {object} Signal, state and dispose function.
 */
const createCallControl = ({ res, timeoutMs }: { res: any; timeoutMs: number }) => {
  const controller = new AbortController()
  const state = { timedOut: false, clientGone: false }
  const timer = setTimeout(() => {
    state.timedOut = true
    controller.abort(new Error('AI gateway timeout'))
  }, timeoutMs)
  const onClose = () => {
    if (res.writableEnded) return
    state.clientGone = true
    controller.abort(new Error('client disconnected'))
  }
  res.on('close', onClose)
  return {
    signal: controller.signal,
    state,
    dispose: () => {
      clearTimeout(timer)
      res.off('close', onClose)
    },
  }
}

/**
 * Creates a function that records telemetry for the call only the first time it is called.
 * @param {ModelGatewayDeps} deps - Dependencies.
 * @param {TelemetryContext} ctx - Telemetry context.
 * @returns {(outcome: object) => void} The recorder.
 */
const createTelemetryRecorder = (deps: ModelGatewayDeps, ctx: TelemetryContext) => {
  const start = Date.now()
  let recorded = false
  return (outcome: { usage?: unknown; error?: unknown }) => {
    if (recorded) return
    recorded = true
    deps.recordTelemetry(ctx, { latencyMs: Date.now() - start, ...outcome })
  }
}

/**
 * Answers with a JSON error unless the response was already started or closed.
 * @param {object} res - Express response.
 * @param {SystemError} error - The error.
 * @returns {void}
 */
const sendJsonError = (res: any, error: SystemError) => {
  if (!isSseClosed(res) && !res.headersSent) Response.sendErr(res, error)
}

/**
 * Validates the request, applies the gates and resolves the model (nothing reaches the provider yet).
 * @param {object} params - Parameters.
 * @param {object} params.req - Express request.
 * @param {User} params.user - Logged-in user.
 * @param {ModelGatewayDeps} params.deps - Dependencies.
 * @returns {Promise<object>} Request, sanitized call, model and telemetry context.
 */
const prepareCall = async ({ req, user, deps }: { req: any; user: User; deps: ModelGatewayDeps }) => {
  const request = parseGatewayRequest(req.body)
  assertFeatureEnabled(request.feature, user, deps.gateEnv ?? ENV)
  if (!deps.rateLimiter.take(user.uuid)) {
    throw new SystemError('aiRateLimited', {}, TOO_MANY_REQUESTS)
  }
  const call = sanitizeCall(request.call, deps.limits)
  const { model, meta } = await deps.resolveModel({ user, feature: request.feature })
  await deps.assertPolicyAllows({
    surveyId: request.surveyId ?? null,
    dataClass: request.dataClass,
    hostingClass: meta.hostingClass ?? null,
  })
  const ctx: TelemetryContext = {
    feature: request.feature,
    source: meta.source,
    provider: meta.provider,
    model: meta.model,
    userUuid: user.uuid,
  }
  return { request, call, model, ctx }
}

/**
 * Copies the provider stream to the SSE response; stream errors are sent as keys only.
 * @param {object} params - Parameters.
 * @returns {Promise<object>} The outcome (usage or error).
 */
const pumpStream = async ({
  stream,
  res,
  control,
  record,
}: {
  stream: ReadableStream<LanguageModelV4StreamPart>
  res: any
  control: ReturnType<typeof createCallControl>
  record: ReturnType<typeof createTelemetryRecorder>
}): Promise<{ usage?: unknown; error?: unknown }> => {
  const writeEvent = createSseEventWriter(res)
  const reader = stream.getReader()
  const outcome: { usage?: unknown; error?: unknown } = {}
  // a client disconnect must also stop a provider that ignores the abort signal
  control.signal.addEventListener('abort', () => reader.cancel(control.signal.reason).catch(() => {}), { once: true })
  try {
    for (;;) {
      const { value: part, done } = await reader.read()
      if (done || isSseClosed(res)) break
      if (part.type === 'finish') outcome.usage = part.usage
      if (part.type === 'error') outcome.error = part.error
      const wirePart = serializeStreamPart(part, toAiWireError)
      if (wirePart) writeEvent(wirePart)
    }
  } catch (error) {
    outcome.error = error
    if (!isSseClosed(res)) writeEvent({ type: 'error', error: toAiWireError(toAiSystemError(error, control.state)) })
  } finally {
    reader.releaseLock()
  }
  // cancel() ends the read cleanly for piped streams and for providers that ignore the abort signal
  if (control.state.timedOut && !outcome.error) {
    outcome.error = control.signal.reason
    if (!isSseClosed(res))
      writeEvent({ type: 'error', error: toAiWireError(toAiSystemError(outcome.error, control.state)) })
  }
  record(outcome)
  return outcome
}

type RunParams = {
  model: LanguageModelV4
  call: AiGatewayCall
  res: any
  control: ReturnType<typeof createCallControl>
  record: ReturnType<typeof createTelemetryRecorder>
  feature: string
  deps: ModelGatewayDeps
}

/**
 * Runs a non-streaming call and answers with the wire result.
 * @param {RunParams} params - Parameters.
 * @returns {Promise<void>} Resolves when answered.
 */
const runGenerate = async ({ model, call, res, control, record }: RunParams): Promise<void> => {
  const result = await model.doGenerate({ ...call, abortSignal: control.signal })
  record({ usage: result.usage })
  if (!isSseClosed(res)) res.json(serializeGenerateResult(result))
}

/**
 * Runs a streaming call; mid-stream errors are logged in full, the client only gets the mapped key.
 * @param {RunParams} params - Parameters.
 * @returns {Promise<void>} Resolves when the stream is closed.
 */
const runStream = async ({ model, call, res, control, record, feature, deps }: RunParams): Promise<void> => {
  // errors until here (provider refused the call) are answered as plain JSON errors by the caller
  const { stream } = await model.doStream({ ...call, abortSignal: control.signal })
  openSseStream(res)
  const outcome = await pumpStream({ stream, res, control, record })
  if (outcome.error && !control.state.clientGone) deps.logError(formatErrorForLog(feature, outcome.error))
  if (!isSseClosed(res)) closeSseStream(res)
}

/**
 * Handles one gateway request; always answers by itself (JSON, SSE stream or JSON error).
 * @param {object} params - Parameters.
 * @param {object} params.req - Express request (body: AiGatewayRequest).
 * @param {object} params.res - Express response.
 * @param {User} params.user - Logged-in user (permission already checked by the route middleware).
 * @param {ModelGatewayDeps} params.deps - Dependencies.
 * @returns {Promise<void>} Resolves when the response is complete.
 */
export const handleModelRequest = async ({
  req,
  res,
  user,
  deps,
}: {
  req: any
  res: any
  user: User
  deps: ModelGatewayDeps
}): Promise<void> => {
  let prepared: Awaited<ReturnType<typeof prepareCall>>
  try {
    prepared = await prepareCall({ req, user, deps })
  } catch (error) {
    // unexpected failures (not our own SystemErrors) must leave a trace in the server log
    if (!(error instanceof SystemError)) deps.logError(formatErrorForLog(req.body?.feature ?? 'unknown', error))
    sendJsonError(res, toAiSystemError(error))
    return
  }
  const { request, call, model, ctx } = prepared
  const control = createCallControl({ res, timeoutMs: deps.limits.timeoutMs })
  const record = createTelemetryRecorder(deps, ctx)
  try {
    const run = request.stream ? runStream : runGenerate
    await run({ model, call, res, control, record, feature: request.feature, deps })
  } catch (error) {
    record({ error })
    if (!control.state.clientGone) deps.logError(formatErrorForLog(request.feature, error))
    sendJsonError(res, toAiSystemError(error, control.state))
  } finally {
    control.dispose()
  }
}
