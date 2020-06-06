import React, { useEffect } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import * as Survey from '@core/survey/survey'

import { useI18n, useOnSurveyCycleUpdate, useSurveyInfo } from '@webapp/components/hooks'

import { SurveyActions, useSurveyDefsFetched } from '@webapp/store/survey'

const SurveyDefsLoader = (props) => {
  const { children, draft, requirePublish, validate, onSurveyCycleUpdate } = props

  const dispatch = useDispatch()
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const ready = useSurveyDefsFetched(draft)
  const surveyUuid = Survey.getUuid(surveyInfo)

  useEffect(() => {
    if (surveyUuid) {
      dispatch(SurveyActions.initSurveyDefs(draft, validate))
    }
  }, [surveyUuid])

  useOnSurveyCycleUpdate(() => {
    if (surveyUuid) {
      if (onSurveyCycleUpdate) onSurveyCycleUpdate()
      dispatch(SurveyActions.reloadSurveyDefs(draft, validate))
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
