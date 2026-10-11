import type { SceneFilters, SceneResult, SceneSort } from './sceneTypes'

export const DEFAULT_SCENE_FILTERS: SceneFilters = { maxCloud: 20, minCoverage: 80 }
export const SCENE_FILTER_STEP = 5
export const SCENE_SORTS: SceneSort[] = ['newest', 'leastCloud', 'mostCoverage']

type SceneComparator = (sceneA: SceneResult, sceneB: SceneResult) => number

/**
 * Tells whether a scene passes the cloud and coverage limits. Unknown values only pass at the widest
 * setting (max cloud 100, min coverage 0), so a scene is never shown as "clear" without data.
 *
 * @param {SceneResult} scene - Scene.
 * @param {SceneFilters} filters - Limits.
 * @returns {boolean} True when the scene passes.
 */
export const passesSceneFilters = (scene: SceneResult, filters: SceneFilters): boolean => {
  const cloudOk = scene.cloud === null ? filters.maxCloud >= 100 : scene.cloud <= filters.maxCloud
  const coverageOk = scene.coverage === null ? filters.minCoverage <= 0 : scene.coverage >= filters.minCoverage
  return cloudOk && coverageOk
}

/**
 * Keeps the scenes that pass the limits.
 *
 * @param {SceneResult[]} scenes - Scenes.
 * @param {SceneFilters} filters - Limits.
 * @returns {SceneResult[]} Passing scenes.
 */
export const filterScenes = (scenes: SceneResult[], filters: SceneFilters): SceneResult[] =>
  scenes.filter((scene) => passesSceneFilters(scene, filters))

/**
 * Keeps the scenes of one month (UTC), or all of them when no month is chosen.
 *
 * @param {SceneResult[]} scenes - Scenes.
 * @param {string|null} monthKey - Month key YYYY-MM, or null for all months.
 * @returns {SceneResult[]} Scenes of the month (the same array when monthKey is null).
 */
export const filterScenesByMonth = (scenes: SceneResult[], monthKey: string | null): SceneResult[] =>
  monthKey === null ? scenes : scenes.filter((scene) => scene.date.startsWith(`${monthKey}-`))

/**
 * Compares two strings.
 *
 * @param {string} valueA - First value.
 * @param {string} valueB - Second value.
 * @returns {number} Negative, zero or positive.
 */
const compareStrings = (valueA: string, valueB: string): number => {
  if (valueA < valueB) return -1
  if (valueA > valueB) return 1
  return 0
}

/**
 * Compares two nullable numbers ascending, nulls last.
 *
 * @param {number|null} valueA - First value.
 * @param {number|null} valueB - Second value.
 * @returns {number} Negative, zero or positive.
 */
const compareNullableAscending = (valueA: number | null, valueB: number | null): number => {
  if (valueA === valueB) return 0
  if (valueA === null) return 1
  if (valueB === null) return -1
  return valueA - valueB
}

/**
 * Negates a nullable number (to sort descending with compareNullableAscending).
 *
 * @param {number|null} value - Value.
 * @returns {number|null} Negated value or null.
 */
const negate = (value: number | null): number | null => (value === null ? null : -value)

/**
 * Newest first; ties by id so the order is stable.
 *
 * @param {SceneResult} sceneA - First scene.
 * @param {SceneResult} sceneB - Second scene.
 * @returns {number} Comparison result.
 */
const compareNewest: SceneComparator = (sceneA, sceneB) =>
  compareStrings(sceneB.datetime, sceneA.datetime) || compareStrings(sceneA.id, sceneB.id)

const COMPARATORS: Record<SceneSort, SceneComparator> = {
  newest: compareNewest,
  /**
   * Lowest cloud cover first; unknown last.
   *
   * @param {SceneResult} sceneA - First scene.
   * @param {SceneResult} sceneB - Second scene.
   * @returns {number} Comparison result.
   */
  leastCloud: (sceneA, sceneB) => compareNullableAscending(sceneA.cloud, sceneB.cloud) || compareNewest(sceneA, sceneB),
  /**
   * Highest coverage first; unknown last.
   *
   * @param {SceneResult} sceneA - First scene.
   * @param {SceneResult} sceneB - Second scene.
   * @returns {number} Comparison result.
   */
  mostCoverage: (sceneA, sceneB) =>
    compareNullableAscending(negate(sceneA.coverage), negate(sceneB.coverage)) || compareNewest(sceneA, sceneB),
}

/**
 * Returns a sorted copy of the scenes.
 *
 * @param {SceneResult[]} scenes - Scenes (not modified).
 * @param {SceneSort} sort - Sort key; unknown keys sort newest first.
 * @returns {SceneResult[]} Sorted copy.
 */
export const sortScenes = (scenes: SceneResult[], sort: SceneSort): SceneResult[] =>
  [...scenes].sort(COMPARATORS[sort] ?? compareNewest)
