import axios from 'axios'
import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as SurveyValidator from '@core/survey/surveyValidator'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'

import { debounceAction } from '@webapp/utils/reduxUtils'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import * as AppState from '@webapp/app/appState'
import * as NotificationState from '@webapp/app/appNotification/appNotificationState'
import * as SurveyState from '../surveyState'
import * as NodeDefState from '@webapp/loggedin/surveyViews/nodeDef/nodeDefState'

import { hideAppLoader, showAppLoader } from '@webapp/app/actions'
import { showNotification } from '@webapp/app/appNotification/actions'

export const nodeDefCreate = 'survey/nodeDef/create'
export const nodeDefUpdate = 'survey/nodeDef/update'
export const nodeDefDelete = 'survey/nodeDef/delete'
export const nodeDefSave = 'survey/nodeDef/save'
export const nodeDefPropsUpdate = 'survey/nodeDef/props/update'
export const nodeDefPropsUpdateCancel = 'survey/nodeDef/props/update/cancel'

export const nodeDefsValidationUpdate = 'survey/nodeDefsValidation/update'
export const nodeDefsUpdate = 'survey/nodeDefs/update'
export const nodeDefsDelete = 'survey/nodeDefs/delete'

// ==== CREATE

export const createNodeDef = (parent, type, props, history) => async (dispatch, getState) => {
  const state = getState()
  const cycle = SurveyState.getSurveyCycleKey(state)

  const nodeDef = NodeDef.newNodeDef(parent, type, [cycle], props)

  dispatch({ type: nodeDefCreate, nodeDef })

  history.push(`${appModuleUri(designerModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`)

  return nodeDef
}

// ==== Internal update nodeDefs actions
const _onNodeDefsUpdate = (nodeDefsUpdated, nodeDefsValidation) => dispatch => {
  dispatch({ type: nodeDefsValidationUpdate, nodeDefsValidation })

  if (!R.isEmpty(nodeDefsUpdated)) {
    dispatch({ type: nodeDefsUpdate, nodeDefs: nodeDefsUpdated })
  }
}

const _putNodeDefProps = (nodeDef, props, propsAdvanced) => async (dispatch, getState) => {
  const state = getState()
  const surveyId = SurveyState.getSurveyId(state)
  const cycle = SurveyState.getSurveyCycleKey(state)
  const nodeDefUuid = NodeDef.getUuid(nodeDef)
  const parentUuid = NodeDef.getParentUuid(nodeDef)

  const {
    data: { nodeDefsValidation, nodeDefsUpdated },
  } = await axios.put(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}/props`, {
    parentUuid,
    cycle,
    props,
    propsAdvanced,
  })

  dispatch(_onNodeDefsUpdate(nodeDefsUpdated, nodeDefsValidation))
}

const _putNodeDefPropsDebounced = (nodeDef, key, props, propsAdvanced) =>
  debounceAction(_putNodeDefProps(nodeDef, props, propsAdvanced), `${nodeDefUpdate}_${NodeDef.getUuid(nodeDef)}_${key}`)

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

const _validateAndNotifyNodeDefUpdate = (nodeDef, props = {}, propsAdvanced = {}) => async (dispatch, getState) => {
  const state = getState()

  const survey = SurveyState.getSurvey(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const parentNodeDef = Survey.getNodeDefParent(nodeDef)(survey)

  // Validate node def
  const surveyUpdated = R.pipe(
    // Associate updated node def
    Survey.assocNodeDef(nodeDef),
    // Build and associate dependency graph
    Survey.buildAndAssocDependencyGraph,
  )(survey)

  const nodeDefValidation = await SurveyValidator.validateNodeDef(surveyUpdated, nodeDef)

  dispatch({
    type: nodeDefPropsUpdate,
    nodeDef,
    nodeDefValidation,
    parentNodeDef,
    props,
    propsAdvanced,
    surveyCycleKey,
  })
}

export const setNodeDefParentUuid = parentUuid => (dispatch, getState) => {
  const state = getState()
  const nodeDef = NodeDefState.getNodeDef(state)

  const nodeDefUpdated = NodeDef.assocParentUuid(parentUuid)(nodeDef)

  dispatch(_validateAndNotifyNodeDefUpdate(nodeDefUpdated))
}

export const setNodeDefProp = (key, value = null, advanced = false) => async (dispatch, getState) => {
  const state = getState()
  const nodeDef = NodeDefState.getNodeDef(state)

  if (!_checkCanChangeProp(dispatch, nodeDef, key, value)) {
    return
  }

  const props = advanced ? {} : { [key]: value }
  const propsAdvanced = advanced ? { [key]: value } : {}

  if (key === NodeDef.propKeys.multiple) {
    // If setting "multiple", reset validations required or count
    propsAdvanced[NodeDef.keysPropsAdvanced.validations] = value
      ? NodeDefValidations.dissocRequired(NodeDef.getValidations(nodeDef))
      : NodeDefValidations.dissocCount(NodeDef.getValidations(nodeDef))
  }

  const nodeDefUpdated = R.pipe(NodeDef.mergeProps(props), NodeDef.mergePropsAdvanced(propsAdvanced))(nodeDef)

  dispatch(_validateAndNotifyNodeDefUpdate(nodeDefUpdated, props, propsAdvanced))
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

      if (isRenderTable) {
        layoutCycle[NodeDefLayout.keys.layoutChildren] = Survey.getNodeDefChildren(nodeDef)(survey).map(n =>
          NodeDef.getUuid(n),
        )
      } else if (NodeDefLayout.isDisplayInParentPage(surveyCycleKey)(nodeDef)) {
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

  await dispatch({
    type: nodeDefPropsUpdateCancel,
    nodeDef,
    nodeDefOriginal,
    isNodeDefNew: NodeDef.isTemporary(nodeDef),
  })

  history.goBack()
}

/**
 * Persists the temporary changes applied to the node def in the state
 */
export const saveNodeDefEdits = () => async (dispatch, getState) => {
  const state = getState()
  const nodeDef = NodeDefState.getNodeDef(state)
  const validation = NodeDefState.getValidation(state)

  if (SurveyValidator.isNodeDefValidationValidOrHasOnlyMissingChildrenErrors(nodeDef, validation)) {
    dispatch(showAppLoader())

    const survey = SurveyState.getSurvey(state)
    const surveyId = SurveyState.getSurveyId(state)
    const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

    const isNodeDefNew = NodeDef.isTemporary(nodeDef)
    const nodeDefUpdated = NodeDef.dissocTemporary(nodeDef)

    if (isNodeDefNew) {
      const {
        data: { nodeDefsValidation, nodeDefsUpdated },
      } = await axios.post(`/api/survey/${surveyId}/nodeDef`, { surveyCycleKey, nodeDef: nodeDefUpdated })
      dispatch(_onNodeDefsUpdate(nodeDefsUpdated, nodeDefsValidation))
    } else {
      const props = NodeDefState.getPropsUpdated(state)
      const propsAdvanced = NodeDefState.getPropsAdvancedUpdated(state)

      await dispatch(_putNodeDefProps(nodeDefUpdated, props, propsAdvanced))
    }

    // Update node def edit state
    dispatch({
      type: nodeDefSave,
      nodeDef: nodeDefUpdated,
      nodeDefParent: Survey.getNodeDefParent(nodeDef)(survey),
      surveyCycleKey,
      nodeDefValidation: NodeDefState.getValidation(state),
    })

    dispatch(hideAppLoader())

    dispatch(showNotification('common.saved', {}, null, 3000))
  } else {
    // Cannot save node def: show notification
    dispatch(showNotification('common.formContainsErrorsCannotSave', {}, NotificationState.severity.error))
  }
}

// ==== DELETE

const _checkCanRemoveNodeDef = nodeDef => (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const i18n = AppState.getI18n(state)

  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  // Check if nodeDef is referenced by other node definitions
  // dependency graph is not associated to the survey in UI, it's built every time it's needed
  const nodeDefDependentsUuids = R.pipe(
    Survey.buildAndAssocDependencyGraph,
    Survey.getNodeDefDependencies(nodeDefUuid),
    R.without(nodeDefUuid),
  )(survey)

  if (R.isEmpty(nodeDefDependentsUuids)) {
    return true
  }

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
  return false
}

export const removeNodeDef = (nodeDef, history = null) => async (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const i18n = AppState.getI18n(state)

  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  if (
    dispatch(_checkCanRemoveNodeDef(nodeDef)) &&
    window.confirm(i18n.t('surveyForm.nodeDefEditFormActions.confirmDelete'))
  ) {
    const surveyId = Survey.getId(survey)
    const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

    const [
      {
        data: { nodeDefsValidation },
      },
    ] = await Promise.all([
      axios.delete(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}`, { params: { surveyCycleKey } }),
      dispatch({ type: nodeDefDelete, nodeDef }),
    ])

    dispatch({ type: nodeDefsValidationUpdate, nodeDefsValidation })
    if (history) {
      history.goBack()
    }
  }
}

export const onNodeDefsDelete = nodeDefUuids => dispatch => {
  if (!R.isEmpty(nodeDefUuids)) {
    dispatch({ type: nodeDefsDelete, nodeDefUuids })
  }
}
