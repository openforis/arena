import axios from 'axios'
import * as R from 'ramda'

import { uuidv4 } from '../../../common/uuid'

import { debounceAction } from '../../utils/reduxUtils'

import Survey from '../../../common/survey/survey'
import NodeDef from '../../../common/survey/nodeDef'
import NodeDefLayout from '../../../common/survey/nodeDefLayout'
import NodeDefValidations from '../../../common/survey/nodeDefValidations'

import * as AppState from '../../app/appState'
import * as SurveyState from '../surveyState'

import { showNotificationMessage } from '../../app/actions'

export const nodeDefCreate = 'survey/nodeDef/create'
export const nodeDefPropsUpdate = 'survey/nodeDef/props/update'
export const nodeDefDelete = 'survey/nodeDef/delete'

export const nodeDefsValidationUpdate = 'survey/nodeDefsValidation/update'
export const nodeDefsUpdate = 'survey/nodeDefs/update'

// ==== Internal update nodeDefs actions

const _putNodeDefProps = (nodeDef, props, propsAdvanced) => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const cycle = SurveyState.getSurveyCycleKey(state)
  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  const { data: { nodeDefsValidation, nodeDefsUpdated } } = await axios.put(
    `/api/survey/${surveyId}/nodeDef/${nodeDefUuid}/props`,
    { cycle, props, propsAdvanced }
  )

  dispatch({ type: nodeDefsValidationUpdate, nodeDefsValidation })

  if (!!nodeDefsUpdated)
    dispatch({ type: nodeDefsUpdate, nodeDefs: nodeDefsUpdated })
}

const _putNodeDefPropsDebounced = (nodeDef, key, props, propsAdvanced) => debounceAction(
  _putNodeDefProps(nodeDef, props, propsAdvanced),
  `${nodeDefPropsUpdate}_${NodeDef.getUuid(nodeDef)}_${key}`
)

const _updateParentLayout = (nodeDef, deleted = false) => async (dispatch, getState) => {
  const survey = SurveyState.getSurvey(getState())
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)

  if (NodeDef.isEntity(nodeDefParent) && NodeDefLayout.isRenderTable(nodeDefParent)) {
    const nodeDefParentLayout = NodeDefLayout.getLayout(nodeDefParent)
    const nodeDefUuid = NodeDef.getUuid(nodeDef)

    const newLayout = deleted ? R.without([nodeDefUuid])(nodeDefParentLayout) : R.append(nodeDefUuid)(nodeDefParentLayout)
    dispatch(putNodeDefProp(nodeDefParent, NodeDefLayout.nodeDefLayoutProps.layout, newLayout))
  }
}

// ==== CREATE

export const createNodeDef = (parentUuid, type, props) => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const cycle = SurveyState.getSurveyCycleKey(state)

  const nodeDef = NodeDef.newNodeDef(parentUuid, type, cycle, props)

  dispatch({ type: nodeDefCreate, nodeDef })

  const { data: { nodeDefsValidation } } = await axios.post(`/api/survey/${surveyId}/nodeDef`, nodeDef)
  dispatch({ type: nodeDefsValidationUpdate, nodeDefsValidation })

  dispatch(_updateParentLayout(nodeDef))
}

// ==== UPDATE

export const putNodeDefProp = (nodeDef, key, value = null, advanced = false) => async (dispatch, getState) => {
  if (!_checkCanChangeProp(dispatch, nodeDef, key, value))
    return

  const survey = SurveyState.getSurvey(getState())
  const parentNodeDef = Survey.getNodeDefParent(nodeDef)(survey)

  const props = advanced ? {} : { [key]: value }
  const propsAdvanced = advanced ? { [key]: value } : {}

  if (key === NodeDefLayout.nodeDefLayoutProps.render) {
    // If setting layout render mode (table | form), set the the proper layout
    const isRenderTable = value === NodeDefLayout.nodeDefRenderType.table
    const isRenderForm = value === NodeDefLayout.nodeDefRenderType.form

    props[NodeDefLayout.nodeDefLayoutProps.layout] = isRenderTable
      ? Survey.getNodeDefChildren(nodeDef)(survey).map(n => NodeDef.getUuid(n))
      : null

    // entity rendered as form can only exists in its own page
    if (isRenderForm && NodeDefLayout.isDisplayInParentPage(nodeDef)) {
      props[NodeDefLayout.nodeDefLayoutProps.pageUuid] = uuidv4()
    }
  } else if (key === NodeDef.propKeys.multiple) {
    // If setting "multiple", reset validations required or count
    propsAdvanced[NodeDef.propKeys.validations] = value
      ? NodeDefValidations.dissocRequired(NodeDef.getValidations(nodeDef))
      : NodeDefValidations.dissocCount(NodeDef.getValidations(nodeDef))
  }

  dispatch({
    type: nodeDefPropsUpdate,
    nodeDef,
    parentNodeDef,
    nodeDefUuid: NodeDef.getUuid(nodeDef),
    props,
    propsAdvanced
  })

  dispatch(_putNodeDefPropsDebounced(nodeDef, key, props, propsAdvanced))
}

const _checkCanChangeProp = (dispatch, nodeDef, key, value) => {
  if (key === NodeDef.propKeys.multiple && value && NodeDef.hasDefaultValues(nodeDef)) {
    // nodeDef has default values, cannot change into multiple
    dispatch(showNotificationMessage('nodeDefEdit.cannotChangeIntoMultipleWithDefaultValues', null, AppState.notificationSeverity.warning))
    return false
  }
  return true
}

// ==== DELETE
export const removeNodeDef = nodeDef => async (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)

  //check if nodeDef is referenced by other node definitions
  //dependency graph is not associated to the survey in UI, it's built every time it's needed
  const dependencyGraph = Survey.buildDependencyGraph(survey)
  const nodeDefDependentsUuids = Survey.getNodeDefDependencies(NodeDef.getUuid(nodeDef))(dependencyGraph)
  const i18n = AppState.getI18n(state)

  if (!R.isEmpty(nodeDefDependentsUuids)) {
    const nodeDefDependents = R.pipe(
      R.map(R.pipe(
        nodeDefUuid => Survey.getNodeDefByUuid(nodeDefUuid)(survey),
        nodeDef => NodeDef.getLabel(nodeDef, i18n.lang)
      )),
      R.join(', ')
    )(nodeDefDependentsUuids)

    dispatch(showNotificationMessage('nodeDefEdit.cannotDeleteNodeDefReferenced', {
      nodeDef: NodeDef.getLabel(nodeDef, i18n.lang),
      nodeDefDependents
    }, AppState.notificationSeverity.warning))

  } else if (window.confirm(i18n.t('surveyForm.nodeDefEditFormActions.confirmDelete'))) {
    // delete confirmed
    dispatch({ type: nodeDefDelete, nodeDef })

    const surveyId = Survey.getId(survey)
    const cycle = SurveyState.getSurveyCycleKey(state)

    const { data: { nodeDefsValidation } } = await axios.delete(`/api/survey/${surveyId}/nodeDef/${NodeDef.getUuid(nodeDef)}`, { params: cycle })
    dispatch({ type: nodeDefsValidationUpdate, nodeDefsValidation })

    dispatch(_updateParentLayout(nodeDef, true))
  }
}
