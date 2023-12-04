import axios from 'axios'

import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import { SurveyState } from '@webapp/store/survey'
import { UserState } from '@webapp/store/user'
import { LoaderActions } from '@webapp/store/ui'

import { appModuleUri, dataModules } from '@webapp/app/appModules'

import * as ActionTypes from './actionTypes'
import { recordNodesUpdate } from './common'

export const createRecord =
  (navigate, preview = false) =>
  async (dispatch, getState) => {
    dispatch(LoaderActions.showLoader())

    const state = getState()
    const user = UserState.getUser(state)
    const surveyId = SurveyState.getSurveyId(state)
    const cycle = SurveyState.getSurveyCycleKey(state)

    const record = Record.newRecord(user, cycle, preview)

    await axios.post(`/api/survey/${surveyId}/record`, record)

    const recordUuid = Record.getUuid(record)
    if (preview) {
      dispatch({ type: ActionTypes.recordUuidPreviewUpdate, recordUuid })
    } else {
      navigate(`${appModuleUri(dataModules.record)}${recordUuid}`)
    }
  }

export const createNodePlaceholder = (nodeDef, parentNode, defaultValue) => (dispatch) => {
  const node = Node.newNodePlaceholder(nodeDef, parentNode, defaultValue)
  dispatch(recordNodesUpdate({ [Node.getUuid(node)]: node }))
}
