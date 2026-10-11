import React from 'react'
import classNames from 'classnames'

import { useI18nT, useLang } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { getHistogramMax } from './sceneHistogram'
import { formatMonthLabel } from './scenePeriod'
import type { MonthBucket } from './sceneTypes'

type ScenesMonthChartProps = {
  buckets: MonthBucket[]
  activeMonthKey: string | null
  onSelectMonth: (monthKey: string | null) => void
}

/**
 * Returns the bar height in percent of the tallest bar.
 *
 * @param {number} count - Bar count.
 * @param {number} max - Highest count.
 * @returns {number} Height in percent.
 */
const getBarPercent = (count: number, max: number): number => (max > 0 ? Math.round((count / max) * 100) : 0)

/**
 * Clear scenes per month: one bar per month of the period. A bar filters the list to its month.
 *
 * @param {object} props - Props.
 * @param {MonthBucket[]} props.buckets - Months with their counts.
 * @param {string|null} props.activeMonthKey - Month filtering the list, or null.
 * @param {Function} props.onSelectMonth - Called with a month key, or null for all months.
 * @returns {React.ReactElement} The chart.
 */
export const ScenesMonthChart = ({
  buckets,
  activeMonthKey,
  onSelectMonth,
}: ScenesMonthChartProps): React.ReactElement => {
  const t = useI18nT()
  const lang = useLang()
  const max = getHistogramMax(buckets)
  return (
    <div className="scenes-panel__chart">
      <div className="scenes-panel__label-row">
        <span className="scenes-panel__label">{t('mapWorkspace.scenes.chart.title')}</span>
        <button
          type="button"
          className="scenes-panel__link"
          aria-pressed={activeMonthKey === null}
          onClick={() => onSelectMonth(null)}
          data-testid={TestId.mapWorkspace.scenesAllMonths}
        >
          {t('mapWorkspace.scenes.chart.allMonths')}
        </button>
      </div>
      <div className="scenes-panel__bars">
        {buckets.map((bucket) => {
          const active = bucket.key === activeMonthKey
          return (
            <button
              key={bucket.key}
              type="button"
              className={classNames('scenes-panel__bar', { 'scenes-panel__bar--active': active })}
              aria-label={t('mapWorkspace.scenes.chart.bar', {
                month: formatMonthLabel(bucket.key, lang, true),
                count: bucket.count,
              })}
              aria-pressed={active}
              disabled={bucket.count === 0}
              onClick={() => onSelectMonth(active ? null : bucket.key)}
              data-testid={TestId.mapWorkspace.scenesMonthBar(bucket.key)}
            >
              <span className="scenes-panel__bar-count">{bucket.count}</span>
              <span className="scenes-panel__bar-track">
                <span className="scenes-panel__bar-fill" style={{ height: `${getBarPercent(bucket.count, max)}%` }} />
              </span>
              <span className="scenes-panel__bar-label">{formatMonthLabel(bucket.key, lang, false)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
