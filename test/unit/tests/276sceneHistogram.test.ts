/**
 * Clear scenes per month: one zero-filled bucket per calendar month of the period.
 */
import { getHistogramMax, getMonthHistogram } from '@webapp/components/MapContainer/workspace/scenes/sceneHistogram'
import { getScenePeriod } from '@webapp/components/MapContainer/workspace/scenes/scenePeriod'
import type { SceneResult } from '@webapp/components/MapContainer/workspace/scenes/sceneTypes'

const scene = (id: string, date: string): SceneResult => ({
  id,
  datetime: `${date}T08:00:00.000Z`,
  date,
  tile: '37MBU',
  cloud: 5,
  coverage: 100,
  thumbnailUrl: null,
})

const period = getScenePeriod(3, new Date('2026-10-11T10:30:00Z'))

describe('Sentinel-2 scenes per month (276)', () => {
  test('counts scenes per month with empty months as zero', () => {
    const scenes = [
      scene('a', '2026-07-12'),
      scene('b', '2026-07-30'),
      scene('c', '2026-09-01'),
      scene('d', '2026-10-02'),
    ]
    expect(getMonthHistogram(scenes, period)).toEqual([
      { key: '2026-07', year: 2026, month: 7, count: 2 },
      { key: '2026-08', year: 2026, month: 8, count: 0 },
      { key: '2026-09', year: 2026, month: 9, count: 1 },
      { key: '2026-10', year: 2026, month: 10, count: 1 },
    ])
  })

  test('ignores scenes outside the months of the period', () => {
    const buckets = getMonthHistogram([scene('old', '2026-06-30'), scene('new', '2026-11-01')], period)
    expect(buckets.map((bucket) => bucket.count)).toEqual([0, 0, 0, 0])
  })

  test('returns the tallest bar, 0 when empty', () => {
    expect(getHistogramMax(getMonthHistogram([scene('a', '2026-07-12'), scene('b', '2026-07-13')], period))).toBe(2)
    expect(getHistogramMax([])).toBe(0)
  })
})
