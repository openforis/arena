import * as API from '@webapp/service/api'
import { SurveyState } from '@webapp/store/survey'
import { LoaderActions, NotificationActions } from '@webapp/store/ui'

import * as ActionTypes from './actionTypes'

export const previewRecordsMerge =
  ({ sourceRecordUuid, targetRecordUuid }) =>
  async (dispatch, getState) => {
    dispatch(LoaderActions.showLoader())

    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)

    const record = await API.mergeRecords({ surveyId, sourceRecordUuid, targetRecordUuid, preview: true })

    dispatch({ type: ActionTypes.recordLoad, record, noHeader: true })

    dispatch(LoaderActions.hideLoader())
  }

export const mergeRecords =
  ({ sourceRecordUuid, targetRecordUuid, onRecordsUpdate }) =>
  async (dispatch, getState) => {
    dispatch(LoaderActions.showLoader())

    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)
    await API.mergeRecords({ surveyId, sourceRecordUuid, targetRecordUuid })

    onRecordsUpdate()

    dispatch(NotificationActions.notifyInfo({ key: 'dataView.records.merge.performedSuccessfullyMessage' }))

    dispatch(LoaderActions.hideLoader())
  }
