import axios from 'axios'

import * as Node from '@core/record/node'

import { AppSavingActions } from '@webapp/store/app'
import { SurveyState } from '@webapp/store/survey'
import { NotificationActions } from '@webapp/store/ui'

import * as RecordState from '../state'
import * as ActionTypes from './actionTypes'

export const removeNode = (nodeDef, node) => async (dispatch, getState) => {
  dispatch(AppSavingActions.showAppSaving())
  dispatch({ type: ActionTypes.nodeDelete, node })

  const surveyId = SurveyState.getSurveyId(getState())
  await axios.delete(`/api/survey/${surveyId}/record/${Node.getRecordUuid(node)}/node/${Node.getUuid(node)}`)
}

export const recordDeleted = (navigate) => (dispatch) => {
  dispatch({ type: ActionTypes.recordDelete })
  dispatch(NotificationActions.notifyInfo({ key: 'recordView.justDeleted' }))
  navigate.go(-1)
}

export const deleteRecord = (navigate) => async (dispatch, getState) => {
  const state = getState()

  const surveyId = SurveyState.getSurveyId(state)
  const recordUuid = RecordState.getRecordUuid(state)

  await axios.delete(`/api/survey/${surveyId}/record/${recordUuid}`)

  dispatch(recordDeleted(navigate))
}

export const deleteRecordUuidPreview = () => (dispatch) =>
  dispatch({ type: ActionTypes.recordUuidPreviewUpdate, recordUuid: null })
