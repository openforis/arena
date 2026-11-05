import { getPeriodMonthKeys } from './scenePeriod'
import type { MonthBucket, ScenePeriod, SceneResult } from './sceneTypes'

/**
 * Counts scenes per calendar month of the period; months without scenes are kept with count 0.
 *
 * @param {SceneResult[]} scenes - Scenes (already filtered by cloud and coverage).
 * @param {ScenePeriod} period - The period.
 * @returns {MonthBucket[]} One bucket per month, oldest first.
 */
export const getMonthHistogram = (scenes: SceneResult[], period: ScenePeriod): MonthBucket[] => {
  const counts = new Map<string, number>()
  for (const key of getPeriodMonthKeys(period)) {
    counts.set(key, 0)
  }
  for (const scene of scenes) {
    const key = scene.date.slice(0, 7)
    const count = counts.get(key)
    if (count !== undefined) counts.set(key, count + 1)
  }
  const buckets: MonthBucket[] = []
  for (const [key, count] of counts) {
    buckets.push({ key, year: Number(key.slice(0, 4)), month: Number(key.slice(5, 7)), count })
  }
  return buckets
}

/**
 * Returns the highest bucket count.
 *
 * @param {MonthBucket[]} buckets - Buckets.
 * @returns {number} Highest count, 0 when there is no bucket.
 */
export const getHistogramMax = (buckets: MonthBucket[]): number => {
  let max = 0
  for (const bucket of buckets) {
    max = Math.max(max, bucket.count)
  }
  return max
}
