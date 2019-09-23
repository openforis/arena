import React, { useEffect } from 'react'
import { connect } from 'react-redux'

import { useI18n } from '../../../commonComponents/hooks'

import Survey from '../../../../common/survey/survey'

import * as SurveyState from '../../../survey/surveyState'

import { initSurveyDefs } from '../../../survey/actions'

const SurveyDefsLoader = (props) => {

  const {
    surveyInfo, draft, validate,
    ready, requirePublish, children,
    initSurveyDefs
  } = props

  const surveyUuid = Survey.getUuid(surveyInfo)

  useEffect(() => {
    if (surveyUuid) {
      initSurveyDefs(draft, validate)
    }
  }, [surveyUuid])

  const i18n = useI18n()

  return ready
    ? !requirePublish || Survey.isPublished(surveyInfo) || Survey.isFromCollect(surveyInfo)
      ? children
      : (
        <div className="table__empty-rows">
          {i18n.t('surveyDefsLoader.requireSurveyPublish')}
        </div>
      )
    : null

}

const mapStateToProps = (state, { draft }) => ({
  ready: SurveyState.areDefsFetched(draft)(state),
  surveyInfo: SurveyState.getSurveyInfo(state),
})

SurveyDefsLoader.defaultProps = {
  ready: false,
  surveyInfo: null,
  draft: false,
  validate: false,
  requirePublish: false,
}

export default connect(mapStateToProps, { initSurveyDefs })(SurveyDefsLoader)
