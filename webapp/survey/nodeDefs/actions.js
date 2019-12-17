import axios from 'axios'
import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as SurveyValidator from '@core/survey/surveyValidator'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'

import { debounceAction } from '@webapp/utils/reduxUtils'

import { appModuleUri, designerModules } from '@webapp/loggedin/appModules'

import * as AppState from '@webapp/app/appState'
import * as NotificationState from '@webapp/app/appNotification/appNotificationState'
import * as SurveyState from '../surveyState'
import * as NodeDefState from '@webapp/loggedin/surveyViews/nodeDef/nodeDefState'

import { hideAppLoader, showAppLoader } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'
import { nodeDefEditUpdate } from '@webapp/loggedin/surveyViews/nodeDef/actions'

export const nodeDefCreate = 'survey/nodeDef/create'
export const nodeDefUpdate = 'survey/nodeDef/update'
export const nodeDefDelete = 'survey/nodeDef/delete'
export const nodeDefPropsUpdateTemp = 'survey/nodeDef/props/update/temp'
export const nodeDefPropsTempCancel = 'survey/nodeDef/update/cancel'

export const nodeDefsValidationUpdate = 'survey/nodeDefsValidation/update'
export const nodeDefsUpdate = 'survey/nodeDefs/update'

// ==== CREATE

export const createNodeDef = (parent, type, props, history) => async (dispatch, getState) => {
  const state = getState()
  const cycle = SurveyState.getSurveyCycleKey(state)

  const nodeDef = {
    ...NodeDef.newNodeDef(parent, type, cycle, props),
    [NodeDef.keys.temporary]: true, // Used to dissoc node def on cancel if changes are not persisted
  }

  dispatch({ type: nodeDefCreate, nodeDef })

  history.push(`${appModuleUri(designerModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`)
}

// ==== Internal update nodeDefs actions
const _onNodeDefsUpdate = (dispatch, nodeDefsUpdated, nodeDefsValidation) => {
  dispatch({ type: nodeDefsValidationUpdate, nodeDefsValidation })

  if (nodeDefsUpdated) {
    dispatch({ type: nodeDefsUpdate, nodeDefs: nodeDefsUpdated })
  }
}

const _putNodeDefProps = (nodeDef, props, propsAdvanced) => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const cycle = SurveyState.getSurveyCycleKey(state)
  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  const {
    data: { nodeDefsValidation, nodeDefsUpdated },
  } = await axios.put(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}/props`, {
    cycle,
    props,
    propsAdvanced,
  })

  _onNodeDefsUpdate(dispatch, nodeDefsUpdated, nodeDefsValidation)
}

const _putNodeDefPropsDebounced = (nodeDef, key, props, propsAdvanced) =>
  debounceAction(_putNodeDefProps(nodeDef, props, propsAdvanced), `${nodeDefUpdate}_${NodeDef.getUuid(nodeDef)}_${key}`)

const _updateParentLayout = (nodeDef, deleted = false) => async (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)

  if (NodeDefLayout.isRenderTable(surveyCycleKey)(nodeDefParent)) {
    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    const layoutChildren = NodeDefLayout.getLayoutChildren(surveyCycleKey)(nodeDefParent)

    const layoutChildrenUpdated = deleted
      ? R.without([nodeDefUuid])(layoutChildren)
      : R.append(nodeDefUuid)(layoutChildren)

    dispatch(putNodeDefLayoutProp(nodeDefParent, NodeDefLayout.keys.layoutChildren, layoutChildrenUpdated))
  }
}

const _checkCanChangeProp = (dispatch, nodeDef, key, value) => {
  if (key === NodeDef.propKeys.multiple && value && NodeDef.hasDefaultValues(nodeDef)) {
    // NodeDef has default values, cannot change into multiple
    dispatch(
      showNotification(
        'nodeDefEdit.cannotChangeIntoMultipleWithDefaultValues',
        null,
        NotificationState.severity.warning,
      ),
    )
    return false
  }

  return true
}

/**
 * Applies changes only to node def in state
 */
export const setNodeDefProp = (key, value = null, advanced = false, checkFormPageUuid = false) => async (
  dispatch,
  getState,
) => {
  if (!_checkCanChangeProp(dispatch, nodeDef, key, value)) {
    return
  }

  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const nodeDef = NodeDefState.getNodeDef(state)
  const parentNodeDef = Survey.getNodeDefParent(nodeDef)(survey)

  const props = advanced ? {} : { [key]: value }
  const propsAdvanced = advanced ? { [key]: value } : {}

  if (key === NodeDef.propKeys.multiple) {
    // If setting "multiple", reset validations required or count
    propsAdvanced[NodeDef.propKeys.validations] = value
      ? NodeDefValidations.dissocRequired(NodeDef.getValidations(nodeDef))
      : NodeDefValidations.dissocCount(NodeDef.getValidations(nodeDef))
  }

  const nodeDefUpdated = NodeDef.mergeProps(R.mergeLeft(props, propsAdvanced))(nodeDef)

  // Validate node def
  const surveyUpdated = R.pipe(
    // Associate updated node def
    Survey.assocNodeDefs({ ...Survey.getNodeDefs(survey), [NodeDef.getUuid(nodeDefUpdated)]: nodeDefUpdated }),
    // Build and associate dependency graph
    Survey.buildAndAssocDependencyGraph,
  )(survey)

  const nodeDefValidation = await SurveyValidator.validateNodeDef(surveyUpdated, nodeDefUpdated)

  dispatch({
    type: nodeDefPropsUpdateTemp,
    nodeDef: nodeDefUpdated,
    nodeDefValidation,
    parentNodeDef,
    props,
    propsAdvanced,
    surveyCycleKey,
    checkFormPageUuid,
  })
}

const _updateLayoutProp = (getState, nodeDef, key, value) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

  return R.pipe(
    NodeDefLayout.getLayout,
    R.assocPath([surveyCycleKey, key], value),
    R.when(R.always(key === NodeDefLayout.keys.renderType), layout => {
      const layoutCycle = layout[surveyCycleKey]

      // If setting layout render mode (table | form), set the the proper layout
      const isRenderTable = value === NodeDefLayout.renderType.table
      const isRenderForm = value === NodeDefLayout.renderType.form

      if (isRenderTable) {
        layoutCycle[NodeDefLayout.keys.layoutChildren] = Survey.getNodeDefChildren(nodeDef)(survey).map(n =>
          NodeDef.getUuid(n),
        )
      } else if (isRenderForm && NodeDefLayout.isDisplayInParentPage(surveyCycleKey)(nodeDef)) {
        // Entity rendered as form can only exists in its own page
        layoutCycle[NodeDefLayout.keys.pageUuid] = uuidv4()
      }

      return layout
    }),
  )(nodeDef)
}

/**
 * Updates the specified layout prop of the node def being edited, without persisting the change
 */
export const setNodeDefLayoutProp = (key, value) => async (dispatch, getState) => {
  const state = getState()
  const nodeDef = NodeDefState.getNodeDef(state)
  const layoutUpdated = _updateLayoutProp(getState, nodeDef, key, value)

  dispatch(setNodeDefProp(NodeDefLayout.keys.layout, layoutUpdated))
}

/**
 * Updates the specified layout prop of a node def and persists the change
 */
export const putNodeDefLayoutProp = (nodeDef, key, value) => async (dispatch, getState) => {
  const layoutUpdated = _updateLayoutProp(getState, nodeDef, key, value)
  const props = { [NodeDefLayout.keys.layout]: layoutUpdated }
  const nodeDefUpdated = NodeDef.mergeProps(props)(nodeDef)
  dispatch({ type: nodeDefUpdate, nodeDef: nodeDefUpdated })

  dispatch(_putNodeDefPropsDebounced(nodeDef, NodeDefLayout.keys.layout, props))
}

export const cancelNodeDefEdits = history => async (dispatch, getState) => {
  const state = getState()
  const nodeDef = NodeDefState.getNodeDef(state)
  const nodeDefOriginal = NodeDefState.getNodeDefOriginal(state)
  const i18n = AppState.getI18n(state)

  if (!NodeDefState.isDirty(state) || confirm(i18n.t('surveyForm.nodeDefEditFormActions.confirmCancel'))) {
    dispatch({
      type: nodeDefPropsTempCancel,
      nodeDef,
      nodeDefOriginal,
      isNodeDefNew: NodeDef.isTemporary(nodeDef),
    })
    history.goBack()
  }
}

/**
 * Persists the temporary changes applied to the node def in the state
 */
export const saveNodeDefEdits = () => async (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const surveyId = SurveyState.getSurveyId(state)
  const cycle = SurveyState.getSurveyCycleKey(state)
  const nodeDef = NodeDefState.getNodeDef(state)

  dispatch(showAppLoader())

  const isNodeDefNew = NodeDef.isTemporary(nodeDef)
  const nodeDefUpdated = NodeDef.dissocTemporary(nodeDef)

  if (isNodeDefNew) {
    const {
      data: { nodeDefsValidation, nodeDefsUpdated },
    } = await axios.post(`/api/survey/${surveyId}/nodeDef`, nodeDefUpdated)

    _onNodeDefsUpdate(dispatch, nodeDefsUpdated, nodeDefsValidation)

    dispatch(_updateParentLayout(nodeDefUpdated))
  } else {
    const props = NodeDefState.getPropsUpdated(state)
    const propsAdvanced = NodeDefState.getPropsAdvancedUpdated(state)
    dispatch(_putNodeDefProps(nodeDefUpdated, props, propsAdvanced))
  }

  // Update node def edit state
  dispatch({
    type: nodeDefEditUpdate,
    nodeDef: nodeDefUpdated,
    nodeDefParent: Survey.getNodeDefParent(nodeDef)(survey),
    surveyCycleKey: cycle,
    nodeDefValidation: NodeDefState.getValidation(state),
  })

  dispatch(hideAppLoader())
}

// ==== DELETE
export const removeNodeDef = nodeDef => async (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)

  // Check if nodeDef is referenced by other node definitions
  // dependency graph is not associated to the survey in UI, it's built every time it's needed
  const dependencyGraph = Survey.buildDependencyGraph(survey)
  const surveyWithDependencies = Survey.assocDependencyGraph(dependencyGraph)(survey)
  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const nodeDefDependentsUuids = Survey.getNodeDefDependencies(nodeDefUuid)(surveyWithDependencies)
  const i18n = AppState.getI18n(state)

  if (!(R.isEmpty(nodeDefDependentsUuids) || R.equals(nodeDefDependentsUuids, [nodeDefUuid]))) {
    // Node has not dependencies or it has expressions that depend on itself
    const nodeDefDependents = R.pipe(
      R.map(
        R.pipe(
          nodeDefUuid => Survey.getNodeDefByUuid(nodeDefUuid)(survey),
          nodeDef => NodeDef.getLabel(nodeDef, i18n.lang),
        ),
      ),
      R.join(', '),
    )(nodeDefDependentsUuids)

    dispatch(
      showNotification(
        'nodeDefEdit.cannotDeleteNodeDefReferenced',
        {
          nodeDef: NodeDef.getLabel(nodeDef, i18n.lang),
          nodeDefDependents,
        },
        NotificationState.severity.warning,
      ),
    )
  } else if (window.confirm(i18n.t('surveyForm.nodeDefEditFormActions.confirmDelete'))) {
    // Delete confirmed
    dispatch({ type: nodeDefDelete, nodeDef })

    const surveyId = Survey.getId(survey)
    const cycle = SurveyState.getSurveyCycleKey(state)

    const {
      data: { nodeDefsValidation },
    } = await axios.delete(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}`, {
      params: cycle,
    })
    dispatch({ type: nodeDefsValidationUpdate, nodeDefsValidation })

    dispatch(_updateParentLayout(nodeDef, true))
  }
}
