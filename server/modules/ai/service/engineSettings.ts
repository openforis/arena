/**
 * Instance settings the browser needs to choose an AI engine (sent with GET /api/ai/settings).
 */
import type { AiPolicy } from '@common/ai/policy'
import { ENV } from '@core/processUtils'

import { type AiPolicyCeilingEnv, getAiPolicyCeilings } from './policyCeilings'

type EngineSettingsEnv = AiPolicyCeilingEnv & {
  aiOrgHostedBaseUrls: string[]
  aiMaxPromptChars: number
}

export type AiEngineSettingsFields = {
  orgHostedBaseUrls: string[]
  policyCeilings: AiPolicy
  maxPromptChars: number
}

/**
 * Returns the org-hosted allowlist, the instance policy ceilings and the gateway prompt cap.
 * @param {EngineSettingsEnv} [env] - Environment (default: ENV).
 * @returns {AiEngineSettingsFields} The fields to add to the settings response.
 */
export const getEngineSettingsFields = (env: EngineSettingsEnv = ENV as EngineSettingsEnv): AiEngineSettingsFields => ({
  orgHostedBaseUrls: [...env.aiOrgHostedBaseUrls],
  policyCeilings: getAiPolicyCeilings(env),
  maxPromptChars: env.aiMaxPromptChars,
})
