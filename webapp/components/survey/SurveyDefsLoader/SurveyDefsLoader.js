import React, { useCallback, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'

import * as AppWebSocket from '@webapp/app/appWebSocket'

import { useI18n } from '@webapp/store/system'

import { SurveyActions, useOnSurveyCycleUpdate, useSurveyDefsFetched, useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanUseAnalysis } from '@webapp/store/user'
import { RecordState } from '@webapp/store/ui/record'

import { ActiveSurveyNotSelected } from '@webapp/components/survey/ActiveSurveyNotSelected'
import { WebSocketEvents } from '@common/webSocket/webSocketEvents'

const SurveyDefsLoader = (props) => {
  const { children, draft, requirePublish, validate, onSurveyCycleUpdate } = props

  const dispatch = useDispatch()
  const i18n = useI18n()
  const includeAnalysis = useAuthCanUseAnalysis()
  const surveyInfo = useSurveyInfo()
  const surveyId = Survey.getId(surveyInfo)
  const ready = useSurveyDefsFetched({ draft, includeAnalysis, validate })
  const recordPreviewUuid = useSelector(RecordState.getRecordUuidPreview)

  useEffect(() => {
    if (surveyId && !ready) {
      dispatch(SurveyActions.initSurveyDefs({ draft, validate, includeAnalysis }))
    }
  }, [surveyId, ready])

  useEffect(() => {
    if (surveyId && ready && recordPreviewUuid) {
      dispatch(SurveyActions.refreshSurveyDefs)
    }
  }, [dispatch, ready, recordPreviewUuid, surveyId])

  const onSurveyUpdate = useCallback(
    ({ surveyId: surveyUpdatedId }) => {
      if (surveyUpdatedId === surveyId) {
        dispatch(SurveyActions.resetSurveyDefs())
      }
    },
    [dispatch, surveyId]
  )

  useEffect(() => {
    AppWebSocket.on(WebSocketEvents.surveyUpdate, onSurveyUpdate)
    return () => {
      AppWebSocket.off(WebSocketEvents.surveyUpdate, onSurveyUpdate)
    }
  }, [onSurveyUpdate, surveyId])

  useOnSurveyCycleUpdate(() => {
    if (surveyId) {
      if (onSurveyCycleUpdate) onSurveyCycleUpdate()
      dispatch(SurveyActions.resetSurveyDefs())
    }
  })

  if (!surveyId) {
    return <ActiveSurveyNotSelected />
  }

  if (!ready) {
    return null
  }

  if (
    !requirePublish ||
    Survey.isPublished(surveyInfo) ||
    (Survey.isFromCollect(surveyInfo) && Survey.isRdbInitialized(surveyInfo))
  ) {
    return children
  }

  return <div className="table__empty-rows">{i18n.t('surveyDefsLoader.requireSurveyPublish')}</div>
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
