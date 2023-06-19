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

  const state = getState()
  const record = RecordState.getRecord(state)
  const surveyId = SurveyState.getSurveyId(state)
  const recordUuid = Record.getUuid(record)
  const cycle = Record.getCycle(record)
  const nodeUuid = Node.getUuid(node)

  await axios.delete(`/api/survey/${surveyId}/record/${recordUuid}/node/${nodeUuid}`, {
    data: { cycle },
  })
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
  ({ navigate, recordUuid: recordUuidParam = null, goBackOnDelete = true, onRecordsUpdate = null }) =>
  async (dispatch, getState) => {
    dispatch(LoaderActions.showLoader())

    const state = getState()

    const surveyId = SurveyState.getSurveyId(state)
    const recordUuid = recordUuidParam || RecordState.getRecordUuid(state)

    await axios.delete(`/api/survey/${surveyId}/record/${recordUuid}`)

    dispatch(LoaderActions.hideLoader())

    dispatch(recordDeleted(navigate, goBackOnDelete))

    onRecordsUpdate?.()
  }

export const deleteRecords =
  ({ records, onRecordsUpdate = null }) =>
  async (dispatch, getState) => {
    dispatch(LoaderActions.showLoader())

    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)
    await axios.delete(`/api/survey/${surveyId}/records`, {
      params: { recordUuids: records.map((record) => Record.getUuid(record)) },
    })

    dispatch(LoaderActions.hideLoader())

    dispatch(NotificationActions.notifyInfo({ key: 'dataView.recordDeleted', params: { count: records.length } }))

    onRecordsUpdate?.()
  }

export const deleteRecordUuidPreview = () => (dispatch) =>
  dispatch({ type: ActionTypes.recordUuidPreviewUpdate, recordUuid: null })
