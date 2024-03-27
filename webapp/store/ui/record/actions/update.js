import axios from 'axios'

import { Dates } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'
import * as Record from '@core/record/record'

import { appModules, appModuleUri } from '@webapp/app/appModules'
import { objectToFormData } from '@webapp/service/api'
import { AppSavingActions } from '@webapp/store/app'
import { SurveyState } from '@webapp/store/survey'
import { debounceAction } from '@webapp/utils/reduxUtils'

import * as RecordState from '../state'

import * as ActionTypes from './actionTypes'
import { recordNodesUpdate } from './common'

const _updateNodeDebounced = (node, file, delay) => {
  const action = async (dispatch, getState) => {
    dispatch(AppSavingActions.showAppSaving())

    const state = getState()
    const cycle = SurveyState.getSurveyCycleKey(state)

    const record = RecordState.getRecord(state)
    const draft = record && Record.isPreview(record)

    const formData = objectToFormData({
      cycle,
      draft,
      node: JSON.stringify(node),
      timezoneOffset: Dates.getTimezoneOffset(),
      ...(file ? { file } : {}),
    })

    const recordUuid = Node.getRecordUuid(node)

    const surveyId = SurveyState.getSurveyId(state)
    await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/node`, formData)
  }

  return debounceAction(action, `node_update_${Node.getUuid(node)}`, delay)
}

export const updateNode =
  (nodeDef, node, value, file = null, meta = {}, refData = null) =>
  (dispatch) => {
    const nodeToUpdate = A.pipe(
      A.dissoc(Node.keys.placeholder),
      Node.assocValue(value),
      Node.mergeMeta(meta),
      NodeRefData.assocRefData(refData),
      A.assoc(Node.keys.dirty, true)
    )(node)

    dispatch(recordNodesUpdate({ [Node.getUuid(node)]: nodeToUpdate }))
    dispatch(_updateNodeDebounced(nodeToUpdate, file, Node.isPlaceholder(node) ? 0 : 500))
  }

export const updateRecordStep = (step, navigate) => async (_dispatch, getState) => {
  const state = getState()

  const surveyId = SurveyState.getSurveyId(state)
  const recordUuid = RecordState.getRecordUuid(state)

  await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/step`, {
    step,
  })

  navigate(appModuleUri(appModules.data))
}

export const nodeValidationsUpdate =
  ({ recordUuid, recordValid, validations }) =>
  (dispatch) =>
    dispatch({ type: ActionTypes.validationsUpdate, recordUuid, recordValid, validations })

export const nodesUpdateCompleted = () => (dispatch) => dispatch(AppSavingActions.hideAppSaving())
