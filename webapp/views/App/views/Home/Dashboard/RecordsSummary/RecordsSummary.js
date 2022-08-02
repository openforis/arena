import './RecordsSummary.scss'

import React, { useRef } from 'react'

import * as DateUtils from '@core/dateUtils'

import { useI18n } from '@webapp/store/system'

import Dropdown from '@webapp/components/form/Dropdown'

import { useRecordsSummary, useTimeRanges } from './store'

import Chart from './Chart'

const formatDate = (dateStr) => (dateStr ? DateUtils.format(DateUtils.parseISO(dateStr), 'dd MMMM yyyy') : '')

const RecordsSummary = () => {
  const i18n = useI18n()

  const { from, to, counts, timeRange, onChangeTimeRange } = useRecordsSummary()
  const { timeRangeItems, timeRangeSelection } = useTimeRanges({ timeRange })

  const timeRangeElementRef = useRef(null)

  return (
    <div className="home-dashboard__records-summary">
      <div className="home-dashboard__records-summary-header">
        <h6>
          {i18n.t('homeView.recordsSummary.recordsAdded', {
            from: formatDate(from),
            to: formatDate(to),
          })}
        </h6>

        <div className="time-range" ref={timeRangeElementRef}>
          <span className="icon icon-calendar icon-12px icon-left" />
          <Dropdown
            items={timeRangeItems}
            selection={timeRangeSelection}
            onChange={(item) => onChangeTimeRange({ timeRange: item.value })}
            sourceElement={timeRangeElementRef.current}
            readOnlyInput
          />
        </div>
      </div>

      {from && to && <Chart counts={counts} from={from} to={to} />}
    </div>
  )
}

export default RecordsSummary
