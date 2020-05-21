import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'

import { useI18n, useOnSurveyCycleUpdate, useSurveyInfo } from '@webapp/commonComponents/hooks'

import * as SurveyState from '@webapp/survey/surveyState'
import { initSurveyDefs, reloadSurveyDefs } from '@webapp/survey/actions'

const SurveyDefsLoader = (props) => {
  const { children, draft, requirePublish, validate, onSurveyCycleUpdate } = props

  const dispatch = useDispatch()
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const ready = useSelector(SurveyState.areDefsFetched(draft))
  const surveyUuid = Survey.getUuid(surveyInfo)

  useEffect(() => {
    if (surveyUuid) {
      dispatch(initSurveyDefs(draft, validate))
    }
  }, [surveyUuid])

  useOnSurveyCycleUpdate(() => {
    if (surveyUuid) {
      if (onSurveyCycleUpdate) onSurveyCycleUpdate()
      dispatch(reloadSurveyDefs(draft, validate))
    }
  })

  if (!ready) return null

  return !requirePublish || Survey.isPublished(surveyInfo) || Survey.isFromCollect(surveyInfo) ? (
    children
  ) : (
    <div className="table__empty-rows">{i18n.t('surveyDefsLoader.requireSurveyPublish')}</div>
  )
}

SurveyDefsLoader.propTypes = {
  children: PropTypes.element.isRequired,
  draft: PropTypes.bool,
  requirePublish: PropTypes.bool,
  validate: PropTypes.bool,
  onSurveyCycleUpdate: PropTypes.func,
}

SurveyDefsLoader.defaultProps = {
  draft: false,
  validate: false,
  requirePublish: false,
  onSurveyCycleUpdate: null,
}

export default SurveyDefsLoader
