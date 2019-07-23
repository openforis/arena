import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import Survey from '../../../../common/survey/survey'

import * as SurveyState from '../../../survey/surveyState'

import { initSurveyDefs } from '../../../survey/actions'

const SurveyDefsLoader = (props) => {

  const {
    surveyInfo, draft, validate,
    ready, children,
    initSurveyDefs
  } = props

  const surveyUuid = Survey.getUuid(surveyInfo)

  useEffect(() => {
    if (surveyUuid) {
      initSurveyDefs(draft, validate)
    }
  }, [surveyUuid])

  return ready
    ? children
    : null

}

const mapStateToProps = (state, props) => ({
  ready: SurveyState.areDefsFetched(state) && SurveyState.areDefsDraftFetched(state) === props.draft,
  surveyInfo: SurveyState.getSurveyInfo(state),
})

export default connect(mapStateToProps, { initSurveyDefs })(SurveyDefsLoader)
