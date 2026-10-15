import {
  aiPolicyLevels,
  clampDataToSchema,
  getPolicyLevelIndex,
  type AiPolicy,
  type AiPolicyLevel,
} from '@common/ai/policy'

export type PolicyLevelOption = { key: AiPolicyLevel; label: string; title: string; disabled: boolean }

/**
 * Returns the levels above a given one (the instance ceiling, or the design level for the record data).
 * @param {AiPolicyLevel} limit - The level.
 * @returns {AiPolicyLevel[]} The levels above it, in order.
 */
export const getLevelsAbove = (limit: AiPolicyLevel): AiPolicyLevel[] =>
  aiPolicyLevels.filter((level) => getPolicyLevelIndex(level) > getPolicyLevelIndex(limit))

/**
 * Returns the ButtonGroup items of a data class control.
 * @param {object} params - Parameters.
 * @param {AiPolicyLevel} params.ceiling - Instance ceiling of the data class.
 * @param {boolean} params.readOnly - True for users who cannot change the policy.
 * @param {AiPolicyLevel} [params.limit] - Highest level allowed besides the ceiling (the design level, for the record data).
 * @returns {PolicyLevelOption[]} The items (label: common key; title: the one-line explanation).
 */
export const getPolicyLevelOptions = ({
  ceiling,
  readOnly,
  limit,
}: {
  ceiling: AiPolicyLevel
  readOnly: boolean
  limit?: AiPolicyLevel
}): PolicyLevelOption[] => {
  const locked = [...getLevelsAbove(ceiling), ...(limit ? getLevelsAbove(limit) : [])]
  return aiPolicyLevels.map((level) => ({
    key: level,
    label: `aiPolicy.level.${level}`,
    title: `homeView:surveyInfo.aiPolicy.levelHint.${level}`,
    disabled: readOnly || locked.includes(level),
  }))
}

/**
 * Returns the policy after the user chose a level. The record data cannot be more permissive than the survey design:
 * lowering the design below the data lowers the data with it.
 * @param {object} params - Parameters.
 * @param {AiPolicy} params.policy - Current policy.
 * @param {keyof AiPolicy} params.dataClass - The class the user changed.
 * @param {AiPolicyLevel} params.level - The chosen level.
 * @returns {{policy: AiPolicy, dataLowered: boolean}} The new policy, and whether the data level was lowered besides the choice.
 */
export const applyPolicyChoice = ({
  policy,
  dataClass,
  level,
}: {
  policy: AiPolicy
  dataClass: keyof AiPolicy
  level: AiPolicyLevel
}): { policy: AiPolicy; dataLowered: boolean } => {
  const next = clampDataToSchema({ ...policy, [dataClass]: level })
  return { policy: next, dataLowered: next.data !== (dataClass === 'data' ? level : policy.data) }
}

/**
 * Returns the message of a failed save: the server error key when there is one.
 * @param {object} params - Parameters.
 * @param {any} params.error - Axios error (or any error).
 * @param {Function} params.t - Translation function.
 * @returns {string} The message.
 */
export const getPolicySaveErrorMessage = ({
  error,
  t,
}: {
  error: any
  t: (key: string, params?: object) => string
}): string => {
  const data = error?.response?.data
  if (!data?.key) return String(error?.message ?? error)
  // SystemError keys are bare (appErrors namespace); unexpected errors come as 'appErrors:generic'
  const key = String(data.key).includes(':') ? data.key : `appErrors:${data.key}`
  return t(key, data.params ?? {})
}
