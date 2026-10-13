// common/ai/accessLevel.ts
/**
 * "What AI can see": one level per user (Off, Help only, + Survey design, + Record data). A feature runs only when
 * the level covers its category's rank and its own toggle is on. Pure; shared by the server gate and the browser.
 */
import { AiFeatureCategory } from './features'

export type AiAccessLevel = 0 | 1 | 2 | 3

export const AI_ACCESS_LEVELS: readonly AiAccessLevel[] = [0, 1, 2, 3]

const { chat, expressions, translation, dataDictionary, userActivity, dataQuery } = AiFeatureCategory
const { assistantDesign, assistantAnalysis, assistantCleaning, assistantSuggestions } = AiFeatureCategory

// 1: no survey content, 2: survey design, 3: record data (not AiFeatures.dataClass: the Help chat reads no survey)
export const aiCategoryAccessRanks: Record<AiFeatureCategory, 1 | 2 | 3> = {
  [chat]: 1,
  [assistantSuggestions]: 1,
  [expressions]: 2,
  [translation]: 2,
  [assistantDesign]: 2,
  [dataQuery]: 2,
  [dataDictionary]: 2,
  [assistantAnalysis]: 3,
  [assistantCleaning]: 3,
  [userActivity]: 3,
}

/**
 * Returns true when the value is one of the access levels.
 * @param {unknown} value - Value to check (untrusted input allowed).
 * @returns {boolean} Whether the value is a level.
 */
export const isAiAccessLevel = (value: unknown): value is AiAccessLevel =>
  typeof value === 'number' && (AI_ACCESS_LEVELS as readonly number[]).includes(value)

/**
 * Returns the rank of a category (the lowest level that covers it).
 * @param {string} category - Feature category.
 * @returns {number|null} The rank, or null for an unknown category.
 */
export const getAiCategoryAccessRank = (category: string): number | null =>
  Object.hasOwn(aiCategoryAccessRanks, category) ? aiCategoryAccessRanks[category as AiFeatureCategory] : null

/**
 * Returns true when the level covers the category.
 * @param {string} category - Feature category.
 * @param {AiAccessLevel} level - Access level.
 * @returns {boolean} Whether the category is within the level.
 */
export const isCategoryWithinAccessLevel = (category: string, level: AiAccessLevel): boolean => {
  const rank = getAiCategoryAccessRank(category)
  return rank !== null && rank <= level
}

/**
 * Returns the categories of a rank.
 * @param {number} rank - Rank (1 to 3).
 * @returns {AiFeatureCategory[]} The categories.
 */
export const getAiCategoriesOfRank = (rank: number): AiFeatureCategory[] =>
  (Object.keys(aiCategoryAccessRanks) as AiFeatureCategory[]).filter(
    (category) => aiCategoryAccessRanks[category] === rank
  )

/**
 * Returns the level of settings saved before the levels existed: the lowest level that keeps every enabled toggle.
 * @param {object} params - Parameters.
 * @param {boolean} params.featuresEnabled - The old master switch.
 * @param {object} [params.featureToggles] - Category toggles (only `true` counts).
 * @returns {AiAccessLevel} The level.
 */
export const deriveAiAccessLevel = ({
  featuresEnabled,
  featureToggles,
}: {
  featuresEnabled: boolean
  featureToggles: Record<string, boolean> | null | undefined
}): AiAccessLevel => {
  if (!featuresEnabled) return 0
  let level = 1
  for (const [category, on] of Object.entries(featureToggles ?? {})) {
    const rank = getAiCategoryAccessRank(category)
    if (on === true && rank !== null && rank > level) level = rank
  }
  return level as AiAccessLevel
}

/**
 * Returns the stored level when valid, else the level derived from the old switches.
 * @param {object} params - Parameters.
 * @param {unknown} params.accessLevel - Stored level (untrusted).
 * @param {boolean} params.featuresEnabled - The master switch.
 * @param {object} [params.featureToggles] - Category toggles.
 * @returns {AiAccessLevel} The level.
 */
export const resolveAiAccessLevel = ({
  accessLevel,
  featuresEnabled,
  featureToggles,
}: {
  accessLevel: unknown
  featuresEnabled: boolean
  featureToggles: Record<string, boolean> | null | undefined
}): AiAccessLevel =>
  isAiAccessLevel(accessLevel) ? accessLevel : deriveAiAccessLevel({ featuresEnabled, featureToggles })

/**
 * Returns the toggles after a level change: the ranks the new level adds are switched on, nothing else changes.
 * @param {object} params - Parameters.
 * @param {AiAccessLevel} params.from - Previous level.
 * @param {AiAccessLevel} params.to - New level.
 * @param {object} params.toggles - Category toggles.
 * @returns {object} The new toggles (a new object).
 */
export const raiseAccessLevelToggles = <T extends Record<string, boolean>>({
  from,
  to,
  toggles,
}: {
  from: AiAccessLevel
  to: AiAccessLevel
  toggles: T
}): T => {
  const next: Record<string, boolean> = { ...toggles }
  for (let rank = from + 1; rank <= to; rank += 1) {
    for (const category of getAiCategoriesOfRank(rank)) next[category] = true
  }
  return next as T
}
