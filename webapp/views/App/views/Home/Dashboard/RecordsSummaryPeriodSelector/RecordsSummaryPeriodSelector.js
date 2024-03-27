import './RecordsSummaryPeriodSelector.scss'

import React, { useContext } from 'react'

import * as DateUtils from '@core/dateUtils'

import Dropdown from '@webapp/components/form/Dropdown'
import { useI18n } from '@webapp/store/system'

import { RecordsSummaryContext } from '../RecordsSummaryContext'

import { useTimeRanges } from './store'

const formatDate = (dateStr) => (dateStr ? DateUtils.format(DateUtils.parseISO(dateStr), 'dd MMMM yyyy') : '')

const RecordsSummaryPeriodSelector = () => {
  const i18n = useI18n()

  const { from, to, timeRange, onChangeTimeRange } = useContext(RecordsSummaryContext)
  const { timeRangeItems, timeRangeSelection } = useTimeRanges({ timeRange })

  return (
    <div className="home-dashboard__records-period-selector">
      <div>{i18n.t('homeView.recordsSummary.recordsAddedInTheLast')}</div>
      <div className="time-range">
        <span className="icon icon-calendar icon-12px icon-left" />
        <Dropdown
          clearable={false}
          items={timeRangeItems}
          onChange={(item) => onChangeTimeRange({ timeRange: item.value })}
          searchable={false}
          selection={timeRangeSelection}
        />
      </div>
      {i18n.t('homeView.recordsSummary.fromToPeriod', {
        from: formatDate(from),
        to: formatDate(to),
      })}
    </div>
  )
}

export default RecordsSummaryPeriodSelector
