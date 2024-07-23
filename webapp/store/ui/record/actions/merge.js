import * as API from '@webapp/service/api'
import { SurveyState } from '@webapp/store/survey'
import { LoaderActions } from '@webapp/store/ui'

import * as ActionTypes from './actionTypes'

export const previewRecordsMerge =
  ({ sourceRecordUuid, targetRecordUuid, onRecordsUpdate = null }) =>
  async (dispatch, getState) => {
    dispatch(LoaderActions.showLoader())

    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)

    const record = await API.previewRecordsMerge({ surveyId, sourceRecordUuid, targetRecordUuid })

    dispatch({
      type: ActionTypes.recordLoad,
      record,
      noHeader: true,
    })

    dispatch(LoaderActions.hideLoader())

    onRecordsUpdate?.()
  }
