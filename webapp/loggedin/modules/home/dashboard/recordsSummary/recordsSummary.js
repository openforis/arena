import './recordsSummary.scss'

import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import useI18n from '../../../../../commonComponents/useI18n'
import RecordsSummaryChart from './chart/recordsSummaryChart'

import Survey from '../../../../../../common/survey/survey'
import * as SurveyState from '../../../../../survey/surveyState'

import { fetchRecordsAddedSummary } from './actions'

const RecordsSummary = props => {
  const { surveyInfo, fetchRecordsAddedSummary } = props
  const surveyInfoValid = Survey.isValid(surveyInfo)

  const i18n = useI18n()

  useEffect(() => {
    if (surveyInfoValid) {
      fetchRecordsAddedSummary()
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


        <RecordsSummaryChart/>

      </div>
    )
    : null
}

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
})

export default connect(mapStateToProps, { fetchRecordsAddedSummary })(RecordsSummary)