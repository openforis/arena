import './RecordsSummaryPeriodSelector.scss'

import React, { useContext } from 'react'

import * as DateUtils from '@core/dateUtils'

import { useI18n } from '@webapp/store/system'

import Dropdown from '@webapp/components/form/Dropdown'

import { useTimeRanges } from './store'
import { RecordsSummaryContext } from '../RecordsSummaryContext'

const formatDate = (dateStr) => (dateStr ? DateUtils.format(DateUtils.parseISO(dateStr), 'dd MMMM yyyy') : '')

const RecordsSummaryPeriodSelector = () => {
  const i18n = useI18n()

  const { from, to, timeRange, onChangeTimeRange } = useContext(RecordsSummaryContext)
  const { timeRangeItems, timeRangeSelection } = useTimeRanges({ timeRange })

  return (
    <div className="home-dashboard__records-summary">
      <div className="home-dashboard__records-summary-header">
        <h6>
          {i18n.t('homeView.recordsSummary.recordsAdded', {
            from: formatDate(from),
            to: formatDate(to),
          })}
        </h6>

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
      </div>
    </div>
  )
}

export default RecordsSummaryPeriodSelector
