import { aiPolicyLevels, getPolicyLevelIndex, type AiPolicyLevel } from '@common/ai/policy'

export type PolicyLevelOption = { key: AiPolicyLevel; label: string; title: string; disabled: boolean }

/**
 * Returns the levels above the instance ceiling (not selectable on this instance).
 * @param {AiPolicyLevel} ceiling - Instance ceiling of the data class.
 * @returns {AiPolicyLevel[]} The levels, in order.
 */
export const getLevelsAboveCeiling = (ceiling: AiPolicyLevel): AiPolicyLevel[] =>
  aiPolicyLevels.filter((level) => getPolicyLevelIndex(level) > getPolicyLevelIndex(ceiling))

/**
 * Returns the ButtonGroup items of a data class control.
 * @param {object} params - Parameters.
 * @param {AiPolicyLevel} params.ceiling - Instance ceiling of the data class.
 * @param {boolean} params.readOnly - True for users who cannot change the policy.
 * @returns {PolicyLevelOption[]} The items (label: common key; title: the one-line explanation).
 */
export const getPolicyLevelOptions = ({
  ceiling,
  readOnly,
}: {
  ceiling: AiPolicyLevel
  readOnly: boolean
}): PolicyLevelOption[] => {
  const locked = getLevelsAboveCeiling(ceiling)
  return aiPolicyLevels.map((level) => ({
    key: level,
    label: `aiPolicy.level.${level}`,
    title: `homeView:surveyInfo.aiPolicy.levelHint.${level}`,
    disabled: readOnly || locked.includes(level),
  }))
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
