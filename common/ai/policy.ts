/**
 * Survey AI policy: where a survey's content may be processed, per data class. Pure functions shared by the
 * server (gateway, jobs, API), the browser (model check, availability) and the engine selection.
 *
 * Invariant: record data is never more permissive than the survey design (`data` <= `schema`), because a request on
 * record data also carries design content (survey name, labels). `normalizeAiPolicy` and `getEffectiveAiPolicy`
 * clamp to it and `getAllowedLevel` applies it to a policy that was not clamped.
 */
import SystemError, { StatusCodes } from '@core/systemError'

import type { AiDataClass } from './features'

export const aiPolicyLevels = ['off', 'onDevice', 'orgHosted', 'cloud'] as const

export type AiPolicyLevel = (typeof aiPolicyLevels)[number]

export type AiHostingClass = Exclude<AiPolicyLevel, 'off'>

export const aiHostingClasses: readonly AiHostingClass[] = ['onDevice', 'orgHosted', 'cloud']

export const aiPolicyDataClasses: readonly AiDataClass[] = ['schema', 'data']

export type AiPolicy = { schema: AiPolicyLevel; data: AiPolicyLevel }

export const defaultAiPolicy: AiPolicy = Object.freeze({ schema: 'cloud', data: 'onDevice' })

const OFF: AiPolicyLevel = 'off'

/**
 * Returns true when the value is one of the policy levels.
 * @param {unknown} value - Value to check (untrusted).
 * @returns {boolean} True for a valid level.
 */
export const isAiPolicyLevel = (value: unknown): value is AiPolicyLevel =>
  typeof value === 'string' && (aiPolicyLevels as readonly string[]).includes(value)

/**
 * Returns the position of a level (off = 0 … cloud = 3).
 * @param {string|null|undefined} level - The level.
 * @returns {number} The index, or -1 when the level is unknown.
 */
export const getPolicyLevelIndex = (level: string | null | undefined): number =>
  isAiPolicyLevel(level) ? aiPolicyLevels.indexOf(level) : -1

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// a missing class gets its default; a present but invalid one fails closed
const normalizeLevel = (raw: Record<string, unknown>, dataClass: AiDataClass): AiPolicyLevel => {
  const value = raw[dataClass]
  if (value === undefined || value === null) return defaultAiPolicy[dataClass]
  return isAiPolicyLevel(value) ? value : OFF
}

const toLevelOrOff = (value: unknown): AiPolicyLevel => (isAiPolicyLevel(value) ? value : OFF)

const stricterLevel = (a: unknown, b: unknown): AiPolicyLevel => {
  const levelA = toLevelOrOff(a)
  const levelB = toLevelOrOff(b)
  return getPolicyLevelIndex(levelA) <= getPolicyLevelIndex(levelB) ? levelA : levelB
}

/**
 * Returns true when record data is more permissive than the survey design (a policy the editor and the server refuse).
 * @param {AiPolicy} policy - The policy.
 * @returns {boolean} True when `data` is above `schema`.
 */
export const isDataAboveSchema = (policy: AiPolicy): boolean =>
  getPolicyLevelIndex(policy?.data) > getPolicyLevelIndex(policy?.schema)

/**
 * Lowers the data level to the schema level when it is above it (the invariant `data` <= `schema`).
 * @param {AiPolicy} policy - The policy.
 * @returns {AiPolicy} The clamped policy (a new object).
 */
export const clampDataToSchema = (policy: AiPolicy): AiPolicy => ({
  schema: toLevelOrOff(policy?.schema),
  data: stricterLevel(policy?.data, policy?.schema),
})

/**
 * Returns the level that applies to a data class. Record data is limited by the survey design level too, so a request
 * on record data cannot carry design content (names, labels) to a place the design level forbids.
 * @param {AiPolicy|null|undefined} effective - The policy (clamped or not).
 * @param {string} dataClass - The data class of the request.
 * @returns {AiPolicyLevel} The allowed level; off for a missing policy, an unknown class or an invalid level.
 */
export const getAllowedLevel = (effective: AiPolicy | null | undefined, dataClass: string): AiPolicyLevel => {
  if (!effective) return OFF
  if (dataClass === 'schema') return toLevelOrOff(effective.schema)
  if (dataClass === 'data') return stricterLevel(effective.data, effective.schema)
  return OFF
}

/**
 * Turns a stored (untrusted) policy into a complete one: missing → defaults, invalid → off, data clamped to schema.
 * @param {unknown} raw - The stored value (survey.config.aiPolicy).
 * @returns {AiPolicy} The normalized policy (a new object).
 */
export const normalizeAiPolicy = (raw: unknown): AiPolicy => {
  if (raw === undefined || raw === null) return { ...defaultAiPolicy }
  if (!isPlainObject(raw)) return { schema: OFF, data: OFF }
  return clampDataToSchema({ schema: normalizeLevel(raw, 'schema'), data: normalizeLevel(raw, 'data') })
}

/**
 * Returns the policy actually applied: for each data class, the stricter of the survey setting and the ceiling,
 * with record data not above the survey design.
 * @param {object} params - Parameters.
 * @param {AiPolicy} params.policy - Survey policy (normalized).
 * @param {AiPolicy} params.ceilings - Instance ceilings.
 * @returns {AiPolicy} The effective policy.
 */
export const getEffectiveAiPolicy = ({ policy, ceilings }: { policy: AiPolicy; ceilings: AiPolicy }): AiPolicy =>
  clampDataToSchema({
    schema: stricterLevel(policy?.schema, ceilings?.schema),
    data: stricterLevel(policy?.data, ceilings?.data),
  })

/**
 * Clamps a policy to the ceilings (used when a policy comes from another instance, e.g. survey import).
 * @param {object} params - Parameters.
 * @param {AiPolicy} params.policy - The policy.
 * @param {AiPolicy} params.ceilings - Instance ceilings.
 * @returns {AiPolicy} The clamped policy.
 */
export const clampAiPolicy = (params: { policy: AiPolicy; ceilings: AiPolicy }): AiPolicy =>
  getEffectiveAiPolicy(params)

type HostingCheck = { effective: AiPolicy; dataClass: string; hostingClass: string | null }

/**
 * Returns true when content of the data class may be sent to an engine of the hosting class.
 * @param {HostingCheck} check - Effective policy, data class and hosting class.
 * @returns {boolean} True when allowed. Off, unknown classes and a null hosting class are never allowed.
 */
export const isHostingAllowed = ({ effective, dataClass, hostingClass }: HostingCheck): boolean => {
  if (!(aiHostingClasses as readonly string[]).includes(hostingClass ?? '')) return false
  if (!(aiPolicyDataClasses as readonly string[]).includes(dataClass)) return false
  const allowed = getAllowedLevel(effective, dataClass)
  return getPolicyLevelIndex(hostingClass) <= getPolicyLevelIndex(allowed)
}

/**
 * Throws `aiPolicyRefused` (403) when the hosting class is not allowed for the data class.
 * @param {HostingCheck} check - Effective policy, data class and hosting class.
 * @returns {void}
 */
export const assertHostingAllowed = (check: HostingCheck): void => {
  if (isHostingAllowed(check)) return
  const { effective, dataClass, hostingClass } = check
  const allowed = getAllowedLevel(effective, dataClass)
  throw new SystemError(
    'aiPolicyRefused',
    { dataClass, hostingClass: hostingClass ?? 'unknown', allowed },
    StatusCodes.FORBIDDEN
  )
}

/**
 * Returns the data classes whose level is above the ceiling.
 * @param {object} params - Parameters.
 * @param {AiPolicy} params.policy - Requested policy.
 * @param {AiPolicy} params.ceilings - Instance ceilings.
 * @returns {AiDataClass[]} The classes above their ceiling (empty when none).
 */
export const findLevelsAboveCeiling = ({ policy, ceilings }: { policy: AiPolicy; ceilings: AiPolicy }): AiDataClass[] =>
  aiPolicyDataClasses.filter(
    (dataClass) => getPolicyLevelIndex(policy[dataClass]) > getPolicyLevelIndex(ceilings[dataClass])
  )
