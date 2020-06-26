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

import * as NodeDefState from '@webapp/loggedin/surveyViews/nodeDef/nodeDefState'

import { DialogConfirmActions, LoaderActions, NotificationActions } from '@webapp/store/ui'
import { I18nState } from '@webapp/store/system'

import * as SurveyState from '../state'

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

export const updateNodeDef = ({ nodeDef }) => ({ type: nodeDefUpdate, nodeDef })

// ==== Internal update nodeDefs actions
const _onNodeDefsUpdate = (nodeDefsUpdated, nodeDefsValidation) => (dispatch) => {
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
      NotificationActions.notifyWarning({
        key: 'nodeDefEdit.cannotChangeIntoMultipleWithDefaultValues',
      })
    )
    return false
  }

  return true
}

/**
 * Applies changes only to node def in state.
 */

const _validateAndNotifyNodeDefUpdate = (nodeDef, props = {}, propsAdvanced = {}) => async (dispatch, getState) => {
  const state = getState()

  const survey = SurveyState.getSurvey(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const parentNodeDef = Survey.getNodeDefParent(nodeDef)(survey)

  const surveyUpdated = Survey.assocNodeDef({ nodeDef, updateDependencyGraph: true })(survey)

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

export const setNodeDefParentUuid = (parentUuid) => (dispatch, getState) => {
  const state = getState()
  const nodeDef = NodeDefState.getNodeDef(state)

  const nodeDefUpdated = NodeDef.assocParentUuid(parentUuid)(nodeDef)

  dispatch(_validateAndNotifyNodeDefUpdate(nodeDefUpdated))
}

const _updateLayoutProp = (nodeDef, key, value) => (_, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

  let nodeDefLayout = R.pipe(
    NodeDefLayout.getLayout,
    NodeDefLayout.assocLayoutProp(surveyCycleKey, key, value)
  )(nodeDef)

  // If setting layout render mode (table | form), set the the proper layout
  if (NodeDef.isEntity(nodeDef) && key === NodeDefLayout.keys.renderType) {
    if (value === NodeDefLayout.renderType.table) {
      // Render mode table
      // Assoc layout children
      const nodeDefChildren = Survey.getNodeDefChildren(nodeDef)(survey)
      nodeDefLayout = NodeDefLayout.assocLayoutChildren(
        surveyCycleKey,
        R.map(NodeDef.getUuid, nodeDefChildren)
      )(nodeDefLayout)
    } else {
      // Render mode form
      // Dissoc layoutChildren (applicable only if render mode is table)
      nodeDefLayout = NodeDefLayout.dissocLayoutChildren(surveyCycleKey)(nodeDefLayout)
      // Entity rendered as form can only exists in its own page
      if (NodeDefLayout.isDisplayInParentPage(surveyCycleKey)(nodeDef)) {
        nodeDefLayout = NodeDefLayout.assocPageUuid(surveyCycleKey, uuidv4())(nodeDefLayout)
      }
    }
  }
  return nodeDefLayout
}

export const setNodeDefProp = (key, value = null, advanced = false) => async (dispatch, getState) => {
  const state = getState()
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const nodeDef = NodeDefState.getNodeDef(state)

  if (!_checkCanChangeProp(dispatch, nodeDef, key, value)) {
    return
  }

  const props = advanced ? {} : { [key]: value }
  const propsAdvanced = advanced ? { [key]: value } : {}

  if (key === NodeDef.propKeys.multiple) {
    // Reset validations required or count
    propsAdvanced[NodeDef.keysPropsAdvanced.validations] = value
      ? NodeDefValidations.dissocRequired(NodeDef.getValidations(nodeDef))
      : NodeDefValidations.dissocCount(NodeDef.getValidations(nodeDef))
  }

  let nodeDefUpdated = R.pipe(NodeDef.mergeProps(props), NodeDef.mergePropsAdvanced(propsAdvanced))(nodeDef)

  // If setting "multiple" and nodeDef is single entity and renderType is table, set renderType to Form
  if (
    key === NodeDef.propKeys.multiple &&
    NodeDef.isEntity(nodeDef) &&
    !value &&
    NodeDefLayout.isRenderTable(surveyCycleKey)(nodeDef)
  ) {
    const layoutUpdated = dispatch(
      _updateLayoutProp(nodeDefUpdated, NodeDefLayout.keys.renderType, NodeDefLayout.renderType.form)
    )
    nodeDefUpdated = NodeDefLayout.assocLayout(layoutUpdated)(nodeDefUpdated)
    props[NodeDefLayout.keys.layout] = layoutUpdated
  }

  dispatch(_validateAndNotifyNodeDefUpdate(nodeDefUpdated, props, propsAdvanced))
}

// Updates the specified layout prop of the node def being edited, without persisting the change
export const setNodeDefLayoutProp = (key, value) => async (dispatch, getState) => {
  const state = getState()
  const nodeDef = NodeDefState.getNodeDef(state)
  const layoutUpdated = dispatch(_updateLayoutProp(nodeDef, key, value))

  dispatch(setNodeDefProp(NodeDefLayout.keys.layout, layoutUpdated))
}

// Updates the specified layout prop of a node def and persists the change
export const putNodeDefLayoutProp = (nodeDef, key, value) => async (dispatch) => {
  const layoutUpdated = dispatch(_updateLayoutProp(nodeDef, key, value))
  const props = { [NodeDefLayout.keys.layout]: layoutUpdated }
  const nodeDefUpdated = NodeDef.mergeProps(props)(nodeDef)
  dispatch({ type: nodeDefUpdate, nodeDef: nodeDefUpdated })

  dispatch(_putNodeDefPropsDebounced(nodeDef, NodeDefLayout.keys.layout, props))
}

export const cancelNodeDefEdits = (history) => async (dispatch, getState) => {
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

// Persists the temporary changes applied to the node def in the state
export const saveNodeDefEdits = () => async (dispatch, getState) => {
  const state = getState()
  const nodeDef = NodeDefState.getNodeDef(state)
  const validation = NodeDefState.getValidation(state)

  if (SurveyValidator.isNodeDefValidationValidOrHasOnlyMissingChildrenErrors(nodeDef, validation)) {
    dispatch(LoaderActions.showLoader())

    const survey = SurveyState.getSurvey(state)
    const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

    const surveyId = Survey.getId(survey)
    const isNodeDefNew = NodeDef.isTemporary(nodeDef)
    const nodeDefCycleKeys = NodeDef.getCycles(nodeDef)
    let nodeDefUpdated = NodeDef.dissocTemporary(nodeDef)

    if (isNodeDefNew) {
      if (nodeDefCycleKeys.length > 1) {
        // copy layout of current cycle to all selected cycles
        const layoutCycle = NodeDefLayout.getLayoutCycle(surveyCycleKey)(nodeDefUpdated)
        const layoutUpdated = nodeDefCycleKeys
          .filter((cycleKey) => cycleKey !== surveyCycleKey)
          .reduce(
            (layoutAcc, cycleKey) => NodeDefLayout.assocLayoutCycle(cycleKey, layoutCycle)(layoutAcc),
            NodeDefLayout.getLayout(nodeDef)
          )
        nodeDefUpdated = NodeDefLayout.assocLayout(layoutUpdated)(nodeDefUpdated)
      }
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

    dispatch(LoaderActions.hideLoader())

    dispatch(NotificationActions.notifyInfo({ key: 'common.saved', timeout: 3000 }))
  } else {
    // Cannot save node def: show notification
    dispatch(NotificationActions.notifyError({ key: 'common.formContainsErrorsCannotSave' }))
  }
}

// ==== DELETE

const _checkCanRemoveNodeDef = (nodeDef) => (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const i18n = I18nState.getI18n(state)

  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  // Check if nodeDef is referenced by other node definitions
  // dependency graph is not associated to the survey in UI, it's built every time it's needed
  const nodeDefDependentsUuids = R.pipe(
    Survey.buildAndAssocDependencyGraph,
    Survey.getNodeDefDependencies(nodeDefUuid),
    R.without(nodeDefUuid)
  )(survey)

  if (R.isEmpty(nodeDefDependentsUuids)) {
    return true
  }

  // Node has not dependencies or it has expressions that depend on itself
  const nodeDefDependents = R.pipe(
    R.map(
      R.pipe(
        (nodeDefDependentUuid) => Survey.getNodeDefByUuid(nodeDefDependentUuid)(survey),
        (nodeDefDependent) => NodeDef.getLabel(nodeDefDependent, i18n.lang)
      )
    ),
    R.join(', ')
  )(nodeDefDependentsUuids)

  dispatch(
    NotificationActions.notifyWarning({
      key: 'nodeDefEdit.cannotDeleteNodeDefReferenced',
      params: {
        nodeDef: NodeDef.getLabel(nodeDef, i18n.lang),
        nodeDefDependents,
      },
    })
  )
  return false
}

export const removeNodeDef = (nodeDef, history = null) => async (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)

  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  if (dispatch(_checkCanRemoveNodeDef(nodeDef))) {
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'surveyForm.nodeDefEditFormActions.confirmDelete',
        onOk: async () => {
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
        },
      })
    )
  }
}

export const onNodeDefsDelete = (nodeDefUuids) => (dispatch) => {
  if (!R.isEmpty(nodeDefUuids)) {
    dispatch({ type: nodeDefsDelete, nodeDefUuids })
  }
}
