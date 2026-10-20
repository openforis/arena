import './RecordsSummaryPeriodSelector.scss'

import React from 'react'

import * as DateUtils from '@core/dateUtils'

import { useI18n } from '@webapp/store/system'

import Dropdown from '@webapp/components/form/Dropdown'

import { useTimeRanges } from './store'
import { useRecordsSummaryContext } from '../RecordsSummaryContext'

type RecordsSummaryPeriodSelectorProps = {
  testId?: string
}

const formatDate = (dateStr: string): string =>
  dateStr ? DateUtils.format(DateUtils.parseISO(dateStr), 'DD MMMM YYYY') : ''

const RecordsSummaryPeriodSelector = (props: RecordsSummaryPeriodSelectorProps) => {
  const { testId } = props
  const i18n = useI18n()

  const { from, to, timeRange, onChangeTimeRange } = useRecordsSummaryContext()
  const { timeRangeItems, timeRangeSelection } = useTimeRanges({ timeRange })

  return (
    <div className="home-dashboard__records-period-selector" data-testid={testId}>
      <div>{i18n.t('homeView:recordsSummary.recordsAddedInTheLast')}</div>
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
      {i18n.t('homeView:recordsSummary.fromToPeriod', {
        from: formatDate(from),
        to: formatDate(to),
      })}
    </div>
  )
}

export default RecordsSummaryPeriodSelector
