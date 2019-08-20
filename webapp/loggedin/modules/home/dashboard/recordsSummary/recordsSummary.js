import './recordsSummary.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import useI18n from '../../../../../commonComponents/useI18n'
import RecordsSummaryChart from './chart/recordsSummaryChart'

import Survey from '../../../../../../common/survey/survey'
import * as SurveyState from '../../../../../survey/surveyState'
import * as RecordsSummaryState from './recordsSummaryState'

import { fetchRecordsSummary } from './actions'

const RecordsSummary = props => {
  const {
    surveyInfo, counts, from, to,
    fetchRecordsSummary
  } = props
  const surveyInfoValid = Survey.isValid(surveyInfo)

  const i18n = useI18n()

  useEffect(() => {
    if (surveyInfoValid) {
      fetchRecordsSummary()
    }
  }, [])

  return surveyInfoValid
    ? (
      <div className="home-dashboard__records-summary">

        <div>
          <h6 className="text-uppercase">
            {i18n.t('homeView.recordsSummary.newRecords')}
          </h6>
        </div>

        {
          from && to &&
          <RecordsSummaryChart
            counts={counts}
            from={from}
            to={to}/>
        }

      </div>
    )
    : null
}

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
  counts: RecordsSummaryState.getCounts(state),
  from: RecordsSummaryState.getFrom(state),
  to: RecordsSummaryState.getTo(state),
})

export default connect(mapStateToProps, { fetchRecordsSummary })(RecordsSummary)