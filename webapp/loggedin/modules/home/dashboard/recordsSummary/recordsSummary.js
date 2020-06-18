import './recordsSummary.scss'

import React, { useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'
import Dropdown from '@webapp/components/form/dropdown'

import * as DateUtils from '@core/dateUtils'

import { SurveyState } from '@webapp/store/survey'
import Chart from './chart/Chart'
import * as RecordsSummaryState from './recordsSummaryState'

import { fetchRecordsSummary } from './actions'

const formatDate = (dateStr) => (dateStr ? DateUtils.format(DateUtils.parseISO(dateStr), 'dd MMMM yyyy') : '')

const RecordsSummary = (props) => {
  const { surveyCycleKey, timeRange, from, to, counts, fetchRecordsSummary } = props

  const i18n = useI18n()

  const timeRangeElementRef = useRef(null)

  const timeRangeItems = [
    {
      key: RecordsSummaryState.timeRanges._2Weeks,
      value: i18n.t('homeView.recordsSummary.week', { count: 2 }),
    },
    {
      key: RecordsSummaryState.timeRanges._1Month,
      value: i18n.t('homeView.recordsSummary.month', { count: 1 }),
    },
    {
      key: RecordsSummaryState.timeRanges._3Months,
      value: i18n.t('homeView.recordsSummary.month', { count: 3 }),
    },
    {
      key: RecordsSummaryState.timeRanges._6Months,
      value: i18n.t('homeView.recordsSummary.month', { count: 6 }),
    },
    {
      key: RecordsSummaryState.timeRanges._1Year,
      value: i18n.t('homeView.recordsSummary.year', { count: 1 }),
    },
  ]
  const timeRangeSelection = timeRangeItems.find(R.propEq('key', timeRange))

  useEffect(() => {
    fetchRecordsSummary(surveyCycleKey, timeRange)
  }, [surveyCycleKey])

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
            onChange={(item) => fetchRecordsSummary(surveyCycleKey, item.key)}
            sourceElement={timeRangeElementRef.current}
            readOnlyInput
          />
        </div>
      </div>

      {from && to && <Chart counts={counts} from={from} to={to} />}
    </div>
  )
}

const mapStateToProps = (state) => ({
  surveyCycleKey: SurveyState.getSurveyCycleKey(state),
  timeRange: RecordsSummaryState.getTimeRange(state),
  from: RecordsSummaryState.getFrom(state),
  to: RecordsSummaryState.getTo(state),
  counts: RecordsSummaryState.getCounts(state),
})

export default connect(mapStateToProps, { fetchRecordsSummary })(RecordsSummary)
