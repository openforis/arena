/**
 * Instance ceilings of the survey AI policy: the most permissive level a survey may choose, per data class.
 */
import { ENV } from '@core/processUtils'
import { aiPolicyLevels, isAiPolicyLevel, type AiPolicy, type AiPolicyLevel } from '@common/ai/policy'

export type AiPolicyCeilingEnv = { aiPolicyMaxSchema?: string; aiPolicyMaxData?: string }

const DEFAULT_CEILING: AiPolicyLevel = 'cloud'

const variables = [
  { dataClass: 'schema', envKey: 'aiPolicyMaxSchema', name: 'AI_POLICY_MAX_SCHEMA' },
  { dataClass: 'data', envKey: 'aiPolicyMaxData', name: 'AI_POLICY_MAX_DATA' },
] as const

/**
 * Tells whether an env value is unset or empty.
 * @param {string | undefined} raw - Raw env value.
 * @returns {boolean} True when blank.
 */
const isBlank = (raw: string | undefined): boolean => raw === undefined || raw === null || raw.trim() === ''

/**
 * Parses one ceiling (unset → cloud, invalid → off).
 * @param {string | undefined} raw - Raw env value.
 * @returns {AiPolicyLevel} The ceiling level.
 */
const parseCeiling = (raw: string | undefined): AiPolicyLevel => {
  if (isBlank(raw)) return DEFAULT_CEILING
  const value = (raw as string).trim()
  return isAiPolicyLevel(value) ? value : 'off'
}

/**
 * Returns the instance ceilings (unset → cloud, invalid → off).
 * @param {AiPolicyCeilingEnv} [env] - Environment (defaults to ENV).
 * @returns {AiPolicy} The ceilings.
 */
export const getAiPolicyCeilings = (env: AiPolicyCeilingEnv = ENV): AiPolicy => ({
  schema: parseCeiling(env.aiPolicyMaxSchema),
  data: parseCeiling(env.aiPolicyMaxData),
})

/**
 * Returns one message per invalid ceiling variable (logged at startup).
 * @param {AiPolicyCeilingEnv} [env] - Environment (defaults to ENV).
 * @returns {string[]} The messages (empty when the configuration is valid).
 */
export const getAiPolicyCeilingErrors = (env: AiPolicyCeilingEnv = ENV): string[] => {
  const errors: string[] = []
  for (const { envKey, name } of variables) {
    const raw = env[envKey]
    if (!isBlank(raw) && !isAiPolicyLevel((raw as string).trim())) {
      errors.push(`${name}="${raw}" is not one of ${aiPolicyLevels.join(', ')}: treated as off`)
    }
  }
  return errors
}
