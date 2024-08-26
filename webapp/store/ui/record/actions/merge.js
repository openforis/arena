import * as API from '@webapp/service/api'
import { SurveyState } from '@webapp/store/survey'
import { DialogConfirmActions, LoaderActions, NotificationActions } from '@webapp/store/ui'

import * as ActionTypes from './actionTypes'

const updatedNodesWarnLimit = 10

export const previewRecordsMerge =
  ({ sourceRecordUuid, targetRecordUuid }) =>
  async (dispatch, getState) => {
    dispatch(LoaderActions.showLoader())

    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)

    const { record, nodesUpdated } = await API.mergeRecords({
      surveyId,
      sourceRecordUuid,
      targetRecordUuid,
      preview: true,
    })

    dispatch(LoaderActions.hideLoader())

    const onMergeConfirmed = () => dispatch({ type: ActionTypes.recordLoad, record, noHeader: true })

    if (nodesUpdated > updatedNodesWarnLimit) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'dataView.records.merge.confirmTooManyDifferencesMessage',
          params: { nodesUpdated },
          onOk: onMergeConfirmed,
        })
      )
    } else {
      onMergeConfirmed()
    }
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
