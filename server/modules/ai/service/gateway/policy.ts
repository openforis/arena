/**
 * Survey AI policy enforcement for every model call made by the server (gateway and jobs).
 * Called after the model is resolved and before the provider is called, so a refusal never reaches the provider.
 */
import type { AiDataClass } from '@common/ai/features'
import { assertHostingAllowed, getEffectiveAiPolicy, normalizeAiPolicy, type AiPolicy } from '@common/ai/policy'

import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'

import { getAiPolicyCeilings } from '../policyCeilings'

/**
 * What the survey AI policy decides on: which survey, which kind of data leaves Arena and where the model is hosted.
 */
export type AiPolicyCheck = { surveyId: number | null; dataClass: AiDataClass; hostingClass: string | null }

export type PolicyEnforcerDeps = {
  fetchRawPolicy: (surveyId: number) => Promise<unknown>
  getCeilings: () => AiPolicy
}

/**
 * Returns the effective policy of a call: the survey policy within the ceilings, or the ceilings only without a survey.
 * @param {object} params - Parameters.
 * @param {number|null} params.surveyId - Survey of the call (null for the Help chat and admin calls).
 * @param {PolicyEnforcerDeps} deps - Policy and ceilings readers.
 * @returns {Promise<AiPolicy>} The effective policy.
 */
export const getEffectivePolicyFor = async (
  { surveyId }: { surveyId: number | null },
  deps: PolicyEnforcerDeps
): Promise<AiPolicy> => {
  const ceilings = deps.getCeilings()
  if (surveyId === null || surveyId === undefined) return ceilings
  const policy = normalizeAiPolicy(await deps.fetchRawPolicy(surveyId))
  return getEffectiveAiPolicy({ policy, ceilings })
}

/**
 * Builds the policy check with the given readers (tests inject them).
 * @param {PolicyEnforcerDeps} deps - Policy and ceilings readers.
 * @returns {Function} `(check) => Promise<void>`, rejecting with `aiPolicyRefused` (403) when not allowed.
 */
export const createPolicyEnforcer =
  (deps: PolicyEnforcerDeps) =>
  async ({ surveyId, dataClass, hostingClass }: AiPolicyCheck): Promise<void> => {
    const effective = await getEffectivePolicyFor({ surveyId }, deps)
    assertHostingAllowed({ effective, dataClass, hostingClass })
  }

/**
 * Throws `aiPolicyRefused` (403) when the survey AI policy (or the instance ceilings) refuses the call.
 * No cache: the select is by primary key and costs less than the model call it guards.
 * @param {AiPolicyCheck} check - The call to check.
 * @returns {Promise<void>} Resolves when allowed.
 */
export const assertPolicyAllows = createPolicyEnforcer({
  fetchRawPolicy: (surveyId) => SurveyRepository.fetchSurveyAiPolicy(surveyId),
  getCeilings: () => getAiPolicyCeilings(),
})
