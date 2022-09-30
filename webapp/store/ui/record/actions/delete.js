import axios from 'axios'

import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import { AppSavingActions } from '@webapp/store/app'
import { SurveyState } from '@webapp/store/survey'
import { LoaderActions, NotificationActions } from '@webapp/store/ui'

import * as RecordState from '../state'
import * as ActionTypes from './actionTypes'

export const removeNode = (nodeDef, node) => async (dispatch, getState) => {
  dispatch(AppSavingActions.showAppSaving())
  dispatch({ type: ActionTypes.nodeDelete, node })

  const surveyId = SurveyState.getSurveyId(getState())
  await axios.delete(`/api/survey/${surveyId}/record/${Node.getRecordUuid(node)}/node/${Node.getUuid(node)}`)
}

export const recordDeleted =
  (navigate, goBack = true) =>
  (dispatch) => {
    dispatch({ type: ActionTypes.recordDelete })
    dispatch(NotificationActions.notifyInfo({ key: 'recordView.justDeleted' }))
    if (goBack) {
      navigate(-1)
    }
  }

export const deleteRecord =
  ({ navigate, recordUuid: recordUuidParam = null, goBackOnDelete = true, onRecordsUpdate }) =>
  async (dispatch, getState) => {
    dispatch(LoaderActions.showLoader())

    const state = getState()

    const surveyId = SurveyState.getSurveyId(state)
    const recordUuid = recordUuidParam || RecordState.getRecordUuid(state)

    await axios.delete(`/api/survey/${surveyId}/record/${recordUuid}`)

    dispatch(recordDeleted(navigate, goBackOnDelete))

    onRecordsUpdate()

    dispatch(LoaderActions.hideLoader())
  }

export const deleteRecords =
  ({ records, onRecordsUpdate }) =>
  async (dispatch, getState) => {
    dispatch(LoaderActions.showLoader())

    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)
    await axios.delete(`/api/survey/${surveyId}/records`, {
      params: { recordUuids: records.map((record) => Record.getUuid(record)) },
    })
    dispatch(NotificationActions.notifyInfo({ key: 'dataView.recordDeleted', params: { count: records.length } }))

    onRecordsUpdate()

    dispatch(LoaderActions.hideLoader())
  }

export const deleteRecordUuidPreview = () => (dispatch) =>
  dispatch({ type: ActionTypes.recordUuidPreviewUpdate, recordUuid: null })
