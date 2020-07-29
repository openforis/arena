import * as R from 'ramda'
import axios from 'axios'

import * as Survey from '@core/survey/survey'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'

import { debounceAction } from '@webapp/utils/reduxUtils'

import { SurveyState } from '@webapp/store/survey'

import { LoaderActions, NotificationActions } from '@webapp/store/ui'
import { AppSavingActions } from '@webapp/store/app'

import { appModules, appModuleUri, dataModules } from '@webapp/app/appModules'
import * as RecordState from '../../../loggedin/surveyViews/record/recordState'
import { UserState } from '@webapp/store/user'

export const recordCreate = 'survey/record/create'
export const recordLoad = 'survey/record/load'
export const recordDelete = 'survey/record/delete'
export const recordUuidPreviewUpdate = 'survey/record/preview/update'

export const nodesUpdate = 'survey/record/node/update'
export const nodeDelete = 'survey/record/node/delete'
export const validationsUpdate = 'survey/record/validation/update'

export const recordNodesUpdate = (nodes) => (dispatch, getState) => {
  const record = RecordState.getRecord(getState())
  // Hide app loader on record create
  if (R.isEmpty(Record.getNodes(record))) {
    dispatch(LoaderActions.hideLoader())
  }

  dispatch({ type: nodesUpdate, nodes })
}

export const nodeValidationsUpdate = ({ recordUuid, recordValid, validations }) => (dispatch) =>
  dispatch({ type: validationsUpdate, recordUuid, recordValid, validations })

const _navigateToModuleDataHome = (history) => history.push(appModuleUri(appModules.data))

export const recordDeleted = (history) => (dispatch) => {
  dispatch({ type: recordDelete })
  dispatch(NotificationActions.notifyInfo({ key: 'recordView.justDeleted' }))
  history.goBack()
}

export const sessionExpired = (history) => (dispatch) => {
  dispatch(NotificationActions.notifyInfo({ key: 'recordView.sessionExpired' }))
  _navigateToModuleDataHome(history)
}

export const applicationError = (history, key, params) => (dispatch) => {
  dispatch(NotificationActions.notifyError({ key, params }))
  history.push(appModuleUri(appModules.designer))
}

export const cycleChanged = (history) => () => _navigateToModuleDataHome(history)

// ====== CREATE
export const createRecord = (history, preview = false) => async (dispatch, getState) => {
  dispatch(LoaderActions.showLoader())

  const state = getState()
  const user = UserState.getUser(state)
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

export const createNodePlaceholder = (nodeDef, parentNode, defaultValue) => (dispatch) => {
  const node = Node.newNodePlaceholder(nodeDef, parentNode, defaultValue)
  dispatch(recordNodesUpdate({ [Node.getUuid(node)]: node }))
}

// ====== UPDATE

const _updateNodeDebounced = (node, file, delay) => {
  const action = async (dispatch, getState) => {
    dispatch(AppSavingActions.showAppSaving())

    const formData = new FormData()
    formData.append('node', JSON.stringify(node))

    if (file) {
      formData.append('file', file)
    }

    const surveyId = SurveyState.getSurveyId(getState())
    await axios.post(`/api/survey/${surveyId}/record/${Node.getRecordUuid(node)}/node`, formData)
  }

  return debounceAction(action, `node_update_${Node.getUuid(node)}`, delay)
}

export const updateNode = (nodeDef, node, value, file = null, meta = {}, refData = null) => (dispatch) => {
  const nodeToUpdate = R.pipe(
    R.dissoc(Node.keys.placeholder),
    Node.assocValue(value),
    Node.mergeMeta(meta),
    NodeRefData.assocRefData(refData),
    R.assoc(Node.keys.dirty, true)
  )(node)

  dispatch(recordNodesUpdate({ [Node.getUuid(node)]: nodeToUpdate }))
  dispatch(_updateNodeDebounced(nodeToUpdate, file, Node.isPlaceholder(node) ? 0 : 500))
}

export const updateRecordStep = (step, history) => async (dispatch, getState) => {
  const state = getState()

  const surveyId = SurveyState.getSurveyId(state)
  const recordUuid = RecordState.getRecordUuid(state)

  await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/step`, {
    step,
  })

  history.push(appModuleUri(appModules.data))
}

export const nodesUpdateCompleted = () => (dispatch) => dispatch(AppSavingActions.hideAppSaving())

// ====== DELETE
export const removeNode = (nodeDef, node) => async (dispatch, getState) => {
  dispatch(AppSavingActions.showAppSaving())
  dispatch({ type: nodeDelete, node })

  const surveyId = SurveyState.getSurveyId(getState())
  await axios.delete(`/api/survey/${surveyId}/record/${Node.getRecordUuid(node)}/node/${Node.getUuid(node)}`)
}

export const deleteRecord = (history) => async (dispatch, getState) => {
  const state = getState()

  const surveyId = SurveyState.getSurveyId(state)
  const recordUuid = RecordState.getRecordUuid(state)

  await axios.delete(`/api/survey/${surveyId}/record/${recordUuid}`)

  dispatch(recordDeleted(history))
}

export const deleteRecordUuidPreview = () => (dispatch) => dispatch({ type: recordUuidPreviewUpdate, recordUuid: null })

// ====== Check in / check out record
export const checkInRecord = (recordUuid, draft, pageNodeUuid, pageNodeDefUuid) => async (dispatch, getState) => {
  dispatch(LoaderActions.showLoader())

  const surveyId = SurveyState.getSurveyId(getState())
  const {
    data: { record },
  } = await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/checkin`, {
    draft,
  })

  // This is used by dataQuery when user is editing a specific entity
  if (pageNodeUuid) {
    const state = getState()
    const survey = SurveyState.getSurvey(state)
    const cycle = Record.getCycle(record)

    // Ancestors are needed to find the entity with a pageUuid specified
    const entity = Record.getNodeByUuid(pageNodeUuid)(record)
    const ancestors = Record.getAncestorsAndSelf(entity)(record)
    const pageNodeDef = Survey.getNodeDefByUuid(pageNodeDefUuid)(survey)

    /*
    If a node def to focus is specified and it has its own page, use it as active page,
    otherwise use the one of the first ancestor where it's defined
    */
    const nodeDefActivePage =
      pageNodeDef && NodeDefLayout.hasPage(cycle)(pageNodeDef)
        ? pageNodeDef
        : R.pipe(
            R.map((ancestor) => Survey.getNodeDefByUuid(Node.getNodeDefUuid(ancestor))(survey)),
            R.find(NodeDefLayout.hasPage(cycle))
          )(ancestors)

    // Getting the nodes associated to the nodeDef page
    const formPageNodeUuidByNodeDefUuid = R.reduce(
      (acc, ancestor) => R.assoc(Node.getNodeDefUuid(ancestor), Node.getUuid(ancestor), acc),
      [],
      ancestors
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
    dispatch(LoaderActions.hideLoader())
  }
}

export const checkOutRecord = (recordUuid) => async (dispatch, getState) => {
  const surveyId = SurveyState.getSurveyId(getState())
  // Checkout can be called after logout, therefore checking if survey still exists in state
  if (surveyId) {
    await axios.post(`/api/survey/${surveyId}/record/${recordUuid}/checkout`)
  }
}
