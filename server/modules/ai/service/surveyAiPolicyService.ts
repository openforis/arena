/**
 * Read and update the survey AI policy (stored in survey.config.aiPolicy, not versioned).
 */
import type { User } from '@openforis/arena-core'

import { ENV } from '@core/processUtils'
import SystemError, { StatusCodes } from '@core/systemError'
import * as Survey from '@core/survey/survey'
import * as ActivityLog from '@common/activityLog/activityLog'
import type { AiDataClass } from '@common/ai/features'
import {
  aiPolicyDataClasses,
  clampAiPolicy,
  findLevelsAboveCeiling,
  getEffectiveAiPolicy,
  isAiPolicyLevel,
  normalizeAiPolicy,
  type AiPolicy,
} from '@common/ai/policy'

import { db } from '@server/db/db'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'

import { assertPolicyAllows, type AiPolicyCheck } from './gateway/policy'
import { getProviderHostingClass } from './hostingClass'
import { getAiPolicyCeilings } from './policyCeilings'
import * as ProviderResolver from './providerResolver'

export type SurveyAiPolicyState = { policy: AiPolicy; ceilings: AiPolicy; effective: AiPolicy }

export type SurveyAiPolicyDeps = {
  fetchRawPolicy: (surveyId: number, client?: unknown) => Promise<unknown>
  storePolicy: (params: { surveyId: number; policy: AiPolicy }, client: unknown) => Promise<void>
  insertActivityLog: (params: { user: User; surveyId: number; content: object }, client: unknown) => Promise<void>
  getCeilings: () => AiPolicy
  runInTransaction: <T>(fn: (client: unknown) => Promise<T>) => Promise<T>
}

/**
 * Production dependencies (database, env ceilings).
 * @returns {SurveyAiPolicyDeps} The dependencies.
 */
export const createDefaultSurveyAiPolicyDeps = (): SurveyAiPolicyDeps => ({
  fetchRawPolicy: (surveyId, client = db) => SurveyRepository.fetchSurveyAiPolicy(surveyId, client),
  storePolicy: async ({ surveyId, policy }, client) => {
    await SurveyRepository.updateSurveyConfigurationProp(
      { surveyId, key: Survey.configKeys.aiPolicy, value: JSON.stringify(policy) },
      client as typeof db
    )
  },
  insertActivityLog: async ({ user, surveyId, content }, client) => {
    const system = false
    await ActivityLogRepository.insert(
      user,
      surveyId,
      ActivityLog.type.surveyAiPolicyUpdate,
      content,
      system,
      client as typeof db
    )
  },
  getCeilings: () => getAiPolicyCeilings(),
  runInTransaction: (fn) => db.tx((t: unknown) => fn(t)),
})

const toState = ({ policy, ceilings }: { policy: AiPolicy; ceilings: AiPolicy }): SurveyAiPolicyState => ({
  policy,
  ceilings,
  effective: getEffectiveAiPolicy({ policy, ceilings }),
})

const isSamePolicy = (a: AiPolicy, b: AiPolicy): boolean => a.schema === b.schema && a.data === b.data

/**
 * Validates a policy sent by the client: both classes with a valid level.
 * @param {unknown} body - Request body.
 * @returns {AiPolicy} The policy.
 */
export const parseAiPolicyBody = (body: unknown): AiPolicy => {
  const valid =
    typeof body === 'object' &&
    body !== null &&
    !Array.isArray(body) &&
    aiPolicyDataClasses.every((dataClass) => isAiPolicyLevel((body as Record<string, unknown>)[dataClass]))
  if (!valid) throw new SystemError('aiPolicyInvalid', {}, StatusCodes.BAD_REQUEST)
  const { schema, data } = body as AiPolicy
  return { schema, data }
}

/**
 * Returns the survey AI policy, the instance ceilings and the effective policy.
 * @param {number} surveyId - Survey id.
 * @param {SurveyAiPolicyDeps} [deps] - Dependencies (tests).
 * @returns {Promise<SurveyAiPolicyState>} The policy state.
 */
export const getSurveyAiPolicy = async (
  surveyId: number,
  deps: SurveyAiPolicyDeps = createDefaultSurveyAiPolicyDeps()
): Promise<SurveyAiPolicyState> => {
  const policy = normalizeAiPolicy(await deps.fetchRawPolicy(surveyId))
  return toState({ policy, ceilings: deps.getCeilings() })
}

const assertWithinCeilings = (policy: AiPolicy, ceilings: AiPolicy): void => {
  const [dataClass] = findLevelsAboveCeiling({ policy, ceilings })
  if (!dataClass) return
  throw new SystemError(
    'aiPolicyAboveCeiling',
    { dataClass, level: policy[dataClass], ceiling: ceilings[dataClass] },
    StatusCodes.BAD_REQUEST
  )
}

/**
 * Validates and stores the survey AI policy; logs the change in the survey activity log.
 * @param {object} params - Parameters.
 * @param {User} params.user - Acting user (permission checked by the route).
 * @param {number} params.surveyId - Survey id.
 * @param {unknown} params.policy - Requested policy (request body).
 * @param {SurveyAiPolicyDeps} [deps] - Dependencies (tests).
 * @returns {Promise<SurveyAiPolicyState>} The new policy state.
 */
export const updateSurveyAiPolicy = async (
  { user, surveyId, policy }: { user: User; surveyId: number; policy: unknown },
  deps: SurveyAiPolicyDeps = createDefaultSurveyAiPolicyDeps()
): Promise<SurveyAiPolicyState> => {
  const requested = parseAiPolicyBody(policy)
  const ceilings = deps.getCeilings()
  assertWithinCeilings(requested, ceilings)
  return deps.runInTransaction(async (client) => {
    const from = normalizeAiPolicy(await deps.fetchRawPolicy(surveyId, client))
    await deps.storePolicy({ surveyId, policy: requested }, client)
    if (!isSamePolicy(from, requested)) {
      await deps.insertActivityLog({ user, surveyId, content: { from, to: requested } }, client)
    }
    return toState({ policy: requested, ceilings })
  })
}

type SurveyAiAllowedDeps = {
  resolveConfigForUser: (user: User) => { cfg: { provider: string; baseUrl?: string | null }; source: string } | null
  assertPolicyAllows: (check: AiPolicyCheck) => Promise<void>
  allowlist: string[]
}

const createDefaultSurveyAiAllowedDeps = (): SurveyAiAllowedDeps => ({
  resolveConfigForUser: (user) => ProviderResolver.resolveConfigForUser(user),
  assertPolicyAllows,
  allowlist: ENV.aiOrgHostedBaseUrls,
})

/**
 * Checks, before a job starts, that the survey AI policy allows sending the data class to the user's provider.
 * Resolves the provider config only (no model is built), so the request fails fast instead of on the first batch.
 * @param {object} params - Parameters.
 * @param {User} params.user - Acting user.
 * @param {number} params.surveyId - Survey id.
 * @param {AiDataClass} params.dataClass - Data class sent by the job.
 * @param {SurveyAiAllowedDeps} [deps] - Dependencies (tests).
 * @returns {Promise<void>} Resolves when allowed; rejects with aiNotConfigured (503) or aiPolicyRefused (403).
 */
export const assertSurveyAiAllowed = async (
  { user, surveyId, dataClass }: { user: User; surveyId: number; dataClass: AiDataClass },
  deps: SurveyAiAllowedDeps = createDefaultSurveyAiAllowedDeps()
): Promise<void> => {
  const resolved = deps.resolveConfigForUser(user)
  if (!resolved) throw new SystemError('aiNotConfigured', {}, StatusCodes.SERVICE_UNAVAILABLE)
  const { provider, baseUrl } = resolved.cfg
  const hostingClass = getProviderHostingClass({ provider, baseUrl, allowlist: deps.allowlist })
  await deps.assertPolicyAllows({ surveyId: Number(surveyId), dataClass, hostingClass })
}

/**
 * Returns the exported survey with its raw AI policy in the survey info (only when one is set).
 * @param {object} params - Parameters.
 * @param {object} params.survey - Exported survey (with `info`).
 * @param {unknown} params.rawPolicy - Stored policy, or null.
 * @returns {object} The survey to write in the export file.
 */
export const addAiPolicyToExportedSurvey = ({ survey, rawPolicy }: { survey: any; rawPolicy: unknown }): any => {
  if (rawPolicy === null || rawPolicy === undefined) return survey
  const key = Survey.configKeys.aiPolicy
  // survey.json is the survey info itself; only old exports nest it in `info` (see Survey.getSurveyInfo)
  if (survey.info) return { ...survey, info: { ...survey.info, [key]: rawPolicy } }
  return { ...survey, [key]: rawPolicy }
}

/**
 * Stores the AI policy of an imported (or cloned) survey, clamped to this instance's ceilings.
 * @param {object} params - Parameters.
 * @param {number} params.surveyId - Id of the new survey.
 * @param {object} params.surveyInfo - Survey info read from the import file.
 * @param {Pick<SurveyAiPolicyDeps, 'storePolicy' | 'getCeilings'>} [deps] - Dependencies (tests).
 * @returns {Promise<AiPolicy|null>} The stored policy, or null when the file has none (defaults apply).
 */
export const writeImportedSurveyAiPolicy = async (
  { surveyId, surveyInfo }: { surveyId: number; surveyInfo: any },
  deps: Pick<SurveyAiPolicyDeps, 'storePolicy' | 'getCeilings'> = createDefaultSurveyAiPolicyDeps()
): Promise<AiPolicy | null> => {
  const raw = surveyInfo?.[Survey.configKeys.aiPolicy]
  if (raw === undefined || raw === null) return null
  const policy = clampAiPolicy({ policy: normalizeAiPolicy(raw), ceilings: deps.getCeilings() })
  await deps.storePolicy({ surveyId, policy }, undefined)
  return policy
}
