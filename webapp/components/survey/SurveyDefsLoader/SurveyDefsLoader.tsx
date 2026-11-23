import { useCallback, useEffect, type ReactElement } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router'

import { WebSocketEvents } from '@common/webSocket/webSocketEvents'
import * as Survey from '@core/survey/survey'

import * as AppWebSocket from '@webapp/app/appWebSocket'

import { useI18n } from '@webapp/store/system'
import { SurveyActions, useOnSurveyCycleUpdate, useSurveyDefsFetched, useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanUseAnalysis } from '@webapp/store/user'
import { RecordState } from '@webapp/store/ui/record'

import { ActiveSurveyNotSelected } from '@webapp/components/survey/ActiveSurveyNotSelected'
import { useAppDispatch } from '@webapp/store'

type SurveyDefsLoaderProps = {
  children: ReactElement
  draft?: boolean
  requirePublish?: boolean
  validate?: boolean
  onSurveyCycleUpdate?: (...args: any[]) => any
}

const SurveyDefsLoader = (props: SurveyDefsLoaderProps) => {
  const { children, draft = false, onSurveyCycleUpdate = null, requirePublish = false, validate = false } = props

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const i18n = useI18n()
  const includeAnalysis = useAuthCanUseAnalysis()
  const surveyInfo = useSurveyInfo()
  const surveyId = Survey.getId(surveyInfo)
  const ready = useSurveyDefsFetched({ draft, includeAnalysis, validate })
  const recordPreviewUuid = useSelector(RecordState.getRecordUuidPreview)

  useEffect(() => {
    if (surveyId && !ready) {
      dispatch(SurveyActions.initSurveyDefs({ draft, validate, includeAnalysis, navigate }))
    }
  }, [dispatch, navigate, surveyId, ready])

  useEffect(() => {
    if (surveyId && ready && recordPreviewUuid) {
      dispatch(SurveyActions.refreshSurveyDefs({ navigate }))
    }
  }, [dispatch, navigate, ready, recordPreviewUuid, surveyId])

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
    ((Survey.isFromCollect(surveyInfo) || Survey.isFromOdk(surveyInfo)) && Survey.isRdbInitialized(surveyInfo))
  ) {
    return children
  }

  return <div className="table__empty-rows">{i18n.t('surveyDefsLoader.requireSurveyPublish')}</div>
}

export default SurveyDefsLoader
