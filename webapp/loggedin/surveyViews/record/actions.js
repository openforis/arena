import * as R from 'ramda'
import axios from 'axios'

import * as Survey from '@core/survey/survey'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'

import { debounceAction } from '@webapp/utils/reduxUtils'

import * as SurveyState from '@webapp/survey/surveyState'
import * as AppState from '@webapp/app/appState'
import * as NotificationState from '@webapp/app/appNotification/appNotificationState'

import {
  showAppLoader,
  hideAppLoader,
  showAppSaving,
  hideAppSaving,
} from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'

import { appModules, appModuleUri, dataModules } from '../../appModules'
import * as RecordState from './recordState'

export const recordCreate = 'survey/record/create'
export const recordLoad = 'survey/record/load'
export const recordDelete = 'survey/record/delete'
export const recordUuidPreviewUpdate = 'survey/record/preview/update'

export const nodesUpdate = 'survey/record/node/update'
export const nodeDelete = 'survey/record/node/delete'
export const validationsUpdate = 'survey/record/validation/update'

export const recordNodesUpdate = nodes => (dispatch, getState) => {
  const record = RecordState.getRecord(getState())
  // Hide app loader on record create
  if (R.isEmpty(Record.getNodes(record))) {
    dispatch(hideAppLoader())
  }

  dispatch({ type: nodesUpdate, nodes })
}

export const nodeValidationsUpdate = ({
  recordUuid,
  recordValid,
  validations,
}) => dispatch =>
  dispatch({ type: validationsUpdate, recordUuid, recordValid, validations })

const _navigateToModuleDataHome = history =>
  history.push(appModuleUri(appModules.data))

export const recordDeleted = history => dispatch => {
  dispatch({ type: recordDelete })
  dispatch(showNotification('recordView.justDeleted'))
  _navigateToModuleDataHome(history)
}

export const sessionExpired = history => dispatch => {
  dispatch(showNotification('recordView.sessionExpired'))
  _navigateToModuleDataHome(history)
}

export const applicationError = (history, key, params) => dispatch => {
  dispatch(showNotification(key, params, NotificationState.severity.error))
  history.push(appModuleUri(appModules.designer))
}

export const cycleChanged = history => () => _navigateToModuleDataHome(history)

/**
 * ============
 * CREATE
 * ============
 */
export const createRecord = (history, preview = false) => async (
  dispatch,
  getState,
) => {
  dispatch(showAppLoader())

  const state = getState()
  const user = AppState.getUser(state)
  const surveyId = SurveyState.getSurveyId(state)
  const cycle = SurveyState.getSurveyCycleKey(state)

  const record = Record.newRecord(user, cycle, preview)

  await axios.post(`/api/survey/${surveyId}/record`, record)

  const recordUuid = Record.getUuid(record)
  if (preview) {
    dispatch({ type: recordUuidPreviewUpdate, recordUuid })
  } else {
    history.push(`${appModuleUri(dataModules.record)}${recordUuid}`)
  }
}

export const createNodePlaceholder = (
  nodeDef,
  parentNode,
  defaultValue,
) => dispatch => {
  const node = Node.newNodePlaceholder(nodeDef, parentNode, defaultValue)
  dispatch(recordNodesUpdate({ [Node.getUuid(node)]: node }))
}

/**
 * ============
 * UPDATE
 * ============
 */

export const updateNode = (
  nodeDef,
  node,
  value,
  file = null,
  meta = {},
  refData = null,
) => dispatch => {
  const nodeToUpdate = R.pipe(
    R.dissoc(Node.keys.placeholder),
    Node.assocValue(value),
    Node.mergeMeta(meta),
    NodeRefData.assocRefData(refData),
    R.assoc(Node.keys.dirty, true),
  )(node)

  dispatch(recordNodesUpdate({ [Node.getUuid(node)]: nodeToUpdate }))
  dispatch(
    _updateNodeDebounced(
      nodeToUpdate,
      file,
      Node.isPlaceholder(node) ? 0 : 500,
    ),
  )
}

const _updateNodeDebounced = (node, file, delay) => {
  const action = async (dispatch, getState) => {
    dispatch(showAppSaving())

    const formData = new FormData()
    formData.append('node', JSON.stringify(node))

    if (file) {
      formData.append('file', file)
    }

    const surveyId = SurveyState.getSurveyId(getState())
    await axios.post(
      `/api/survey/${surveyId}/record/${Node.getRecordUuid(node)}/node`,
      formData,
    )
  }

  return debounceAction(action, `node_update_${Node.getUuid(node)}`, delay)
}

export const updateRecordStep = (step, history) => async (
  dispatch,
  getState,
) => {
  const state = getState()

  const surveyId = SurveyState.getSurveyId(state)
  const recordUuid = RecordState.getRecordUuid(state)

  await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/step`, {
    step,
  })

  history.push(appModuleUri(appModules.data))
}

export const nodesUpdateCompleted = () => dispatch => dispatch(hideAppSaving())

/**
 * ============
 * DELETE
 * ============
 */
export const removeNode = (nodeDef, node) => async (dispatch, getState) => {
  dispatch(showAppSaving())
  dispatch({ type: nodeDelete, node })

  const surveyId = SurveyState.getSurveyId(getState())
  await axios.delete(
    `/api/survey/${surveyId}/record/${Node.getRecordUuid(
      node,
    )}/node/${Node.getUuid(node)}`,
  )
}

export const deleteRecord = history => async (dispatch, getState) => {
  const state = getState()

  const surveyId = SurveyState.getSurveyId(state)
  const recordUuid = RecordState.getRecordUuid(state)

  await axios.delete(`/api/survey/${surveyId}/record/${recordUuid}`)

  dispatch(recordDeleted(history))
}

export const deleteRecordUuidPreview = () => dispatch =>
  dispatch({ type: recordUuidPreviewUpdate, recordUuid: null })

/**
 * ============
 * Check in / check out record
 * ============
 */
export const checkInRecord = (recordUuid, draft, entityUuid) => async (
  dispatch,
  getState,
) => {
  dispatch(showAppLoader())

  const surveyId = SurveyState.getSurveyId(getState())
  const {
    data: { record },
  } = await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/checkin`, {
    draft,
  })

  // This is used by dataQuery when user is editing a specific entity
  if (entityUuid) {
    const state = getState()
    const survey = SurveyState.getSurvey(state)

    // Ancestors are needed to find the entity with a pageUuid specified
    const entity = Record.getNodeByUuid(entityUuid)(record)
    const ancestors = Record.getAncestorsAndSelf(entity)(record)

    const nodeDefActivePage = R.pipe(
      R.reverse,
      R.map(ancestor =>
        Survey.getNodeDefByUuid(Node.getNodeDefUuid(ancestor))(survey),
      ),
      R.find(R.pipe(NodeDefLayout.getPageUuid, R.isNil, R.not)),
    )(ancestors)

    // Getting the nodes associated to the nodeDef page
    const formPageNodeUuidByNodeDefUuid = R.reduce(
      (acc, ancestor) =>
        R.assoc(Node.getNodeDefUuid(ancestor), Node.getUuid(ancestor), acc),
      {},
      ancestors,
    )

    dispatch({
      type: recordLoad,
      record,
      nodeDefActivePage,
      formPageNodeUuidByNodeDefUuid,
    })
  } else {
    dispatch({ type: recordLoad, record })
  }

  // Hide app loader on record edit
  if (!R.isEmpty(Record.getNodes(record))) {
    dispatch(hideAppLoader())
  }
}

export const checkOutRecord = recordUuid => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())
  // Checkout can be called after logout, therefore checking if survey still exists in state
  if (surveyId) {
    await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/checkout`)
  }
}
