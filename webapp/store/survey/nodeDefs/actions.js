import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import { UniqueNameGenerator } from '@core/uniqueNameGenerator'

import * as API from '@webapp/service/api'

import { debounceAction } from '@webapp/utils/reduxUtils'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { DialogConfirmActions } from '@webapp/store/ui/dialogConfirm'
import { NotificationActions } from '@webapp/store/ui/notification'

import * as SurveyState from '../state'

export const nodeDefCreate = 'survey/nodeDef/create'
export const nodeDefUpdate = 'survey/nodeDef/update'
export const nodeDefDelete = 'survey/nodeDef/delete'
export const nodeDefsDelete = 'survey/nodeDefs/delete'
export const nodeDefSave = 'survey/nodeDef/save'
export const nodeDefPropsUpdateCancel = 'survey/nodeDef/props/update/cancel'

export const nodeDefsValidationUpdate = 'survey/nodeDefsValidation/update'
export const nodeDefsUpdate = 'survey/nodeDefs/update'

// ==== PLAIN ACTIONS
export const updateNodeDef = ({ nodeDef }) => ({ type: nodeDefUpdate, nodeDef })

export const saveNodeDef = ({ nodeDef, nodeDefParent, surveyCycleKey, nodeDefValidation }) => ({
  type: nodeDefSave,
  nodeDef,
  nodeDefParent,
  surveyCycleKey,
  nodeDefValidation,
})

export const cancelEdit = ({ nodeDef, nodeDefOriginal }) => ({
  type: nodeDefPropsUpdateCancel,
  nodeDef,
  nodeDefOriginal,
  isNodeDefNew: NodeDef.isTemporary(nodeDef),
})

// ==== CREATE

export const createNodeDef = (parent, type, props, navigate) => async (dispatch, getState) => {
  const state = getState()
  const cycle = SurveyState.getSurveyCycleKey(state)

  const nodeDef = NodeDef.newNodeDef(parent, type, [cycle], props)

  dispatch({ type: nodeDefCreate, nodeDef })

  navigate(`${appModuleUri(designerModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`)

  return nodeDef
}

export const createNodeDefs =
  ({ surveyId, surveyCycleKey, nodeDefs }) =>
  async (dispatch) => {
    const { nodeDefsValidation, nodeDefsUpdated } = await API.postNodeDefs({ surveyId, surveyCycleKey, nodeDefs })

    dispatch(
      _onNodeDefsUpdate(
        nodeDefsUpdated.reduce((acc, nodeDef) => ({ ...acc, [nodeDef.uuid]: nodeDef }), {}),
        nodeDefsValidation
      )
    )
  }

export const cloneNodeDefIntoEntityDef =
  ({ nodeDef, nodeDefParentUuid, navigate }) =>
  (dispatch, getState) => {
    const state = getState()
    const survey = SurveyState.getSurvey(state)

    const nodeDefParent = Survey.getNodeDefByUuid(nodeDefParentUuid)(survey)

    const existingNodeDefNames = Survey.getNodeDefsArray(survey).map(NodeDef.getName)
    const clonedNodeDefName = UniqueNameGenerator.generateUniqueName({
      startingName: NodeDef.getName(nodeDef),
      existingNames: existingNodeDefNames,
    })
    const nodeDefCloned = NodeDef.cloneIntoEntityDef({ nodeDefParent, clonedNodeDefName })(nodeDef)
    dispatch({ type: nodeDefCreate, nodeDef: nodeDefCloned })

    navigate(`${appModuleUri(designerModules.nodeDef)}${NodeDef.getUuid(nodeDefCloned)}/`)

    return nodeDefCloned
  }

// ==== Internal update nodeDefs actions
const _onNodeDefsUpdate = (nodeDefsUpdated, nodeDefsValidation) => (dispatch) => {
  dispatch({ type: nodeDefsValidationUpdate, nodeDefsValidation })

  if (!R.isEmpty(nodeDefsUpdated)) {
    dispatch({ type: nodeDefsUpdate, nodeDefs: nodeDefsUpdated })
  }
}

export const putNodeDefProps =
  ({ nodeDefUuid, parentUuid, props = {}, propsAdvanced }) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)
    const cycle = SurveyState.getSurveyCycleKey(state)

    const { nodeDefsValidation, nodeDefsUpdated } = await API.putNodeDefProps({
      surveyId,
      nodeDefUuid,
      parentUuid,
      cycle,
      props,
      propsAdvanced,
    })

    dispatch(_onNodeDefsUpdate(nodeDefsUpdated, nodeDefsValidation))
  }

export const putNodeDefsProps =
  ({ nodeDefs }) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)
    const cycle = SurveyState.getSurveyCycleKey(state)

    const { nodeDefsValidation, nodeDefsUpdated } = await API.putNodeDefsProps({ surveyId, nodeDefs, cycle })

    dispatch(
      _onNodeDefsUpdate(
        nodeDefsUpdated.reduce((acc, nodeDef) => ({ ...acc, [nodeDef.uuid]: nodeDef }), {}),
        nodeDefsValidation
      )
    )
  }

export const postNodeDef =
  ({ nodeDef }) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)
    const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

    const { nodeDefsValidation, nodeDefsUpdated } = await API.postNodeDef({ surveyId, surveyCycleKey, nodeDef })

    dispatch(_onNodeDefsUpdate(nodeDefsUpdated, nodeDefsValidation))
  }

const _putNodeDefPropsDebounced = (nodeDef, key, props, propsAdvanced) =>
  debounceAction(
    putNodeDefProps({
      nodeDefUuid: NodeDef.getUuid(nodeDef),
      parentUuid: NodeDef.getParentUuid(nodeDef),
      props,
      propsAdvanced,
    }),
    `${nodeDefUpdate}_${NodeDef.getUuid(nodeDef)}_${key}`
  )

// Updates the specified layout prop of a node def and persists the change
export const putNodeDefLayoutProp =
  ({ nodeDef, key, value }) =>
  (dispatch, getState) => {
    const state = getState()
    const survey = SurveyState.getSurvey(state)
    const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
    const nodeDefsUpdated = Survey.updateLayoutProp({ surveyCycleKey, nodeDef, key, value })(survey)

    // for each node defs updated, update dispatch nodeDefUpdate event
    Object.values(nodeDefsUpdated).forEach((nodeDefUpdated) => {
      dispatch({ type: nodeDefUpdate, nodeDef: nodeDefUpdated })
    })
    // update the props server side
    const nodeDefUpdated = nodeDefsUpdated[nodeDef.uuid]
    const propsToPersist = { [NodeDefLayout.keys.layout]: NodeDef.getLayout(nodeDefUpdated) }
    dispatch(_putNodeDefPropsDebounced(nodeDef, NodeDef.propKeys.layout, propsToPersist))
  }

export const compressFormItems = (nodeDef) => async (dispatch, getState) => {
  const state = getState()
  const cycle = SurveyState.getSurveyCycleKey(state)
  const layoutChildrenCompact = NodeDefLayout.getLayoutChildrenCompressed({ cycle })(nodeDef)
  dispatch(putNodeDefLayoutProp({ nodeDef, key: NodeDefLayout.keys.layoutChildren, value: layoutChildrenCompact }))
}

// ==== DELETE

const _checkCanRemoveNodeDef = (nodeDef) => (dispatch, getState) => {
  const state = getState()
  const survey = SurveyState.getSurvey(state)
  const lang = SurveyState.getSurveyPreferredLang(state)

  const nodeDefUuid = NodeDef.getUuid(nodeDef)

  // Check if nodeDef is referenced by other node definitions
  // dependency graph is not associated to the survey in UI, it's built every time it's needed
  const nodeDefDependents = R.pipe(
    Survey.buildAndAssocDependencyGraph,
    Survey.getNodeDefDependencies(nodeDefUuid)
  )(survey)

  const nodeDefDependentsNotDescendants = nodeDefDependents.filter(
    (dependent) =>
      // exclude self dependencies
      !NodeDef.isEqual(nodeDef)(dependent) &&
      // exclude dependents that are descendants of the node def being deleted
      !NodeDef.isDescendantOf(nodeDef)(dependent)
  )

  if (R.isEmpty(nodeDefDependentsNotDescendants)) {
    return true
  }

  const nodeDefDependentsText = nodeDefDependentsNotDescendants
    .map((dependent) => `${NodeDef.getLabel(dependent, lang)} (${NodeDef.getName(dependent)})`)
    .join(', ')

  dispatch(
    NotificationActions.notifyWarning({
      key: 'nodeDefEdit.cannotDeleteNodeDefReferenced',
      params: {
        nodeDef: NodeDef.getLabel(nodeDef, lang),
        nodeDefDependents: nodeDefDependentsText,
      },
    })
  )
  return false
}

export const removeNodeDef =
  (nodeDef, navigate = null, callBack = null) =>
  async (dispatch, getState) => {
    const state = getState()
    const survey = SurveyState.getSurvey(state)

    const nodeDefUuid = NodeDef.getUuid(nodeDef)

    if (dispatch(_checkCanRemoveNodeDef(nodeDef))) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'surveyForm.nodeDefEditFormActions.confirmDelete',
          params: { name: NodeDef.getName(nodeDef) },
          onOk: async () => {
            const surveyId = Survey.getId(survey)
            const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

            const [
              {
                data: { nodeDefsUpdated, nodeDefsValidation },
              },
            ] = await Promise.all([
              API.deleteNodeDef({ surveyId, nodeDefUuid, surveyCycleKey }),
              dispatch({ type: nodeDefDelete, nodeDef }),
            ])

            dispatch(_onNodeDefsUpdate(nodeDefsUpdated, nodeDefsValidation))
            callBack?.()
            if (navigate) {
              navigate(-1)
            }
          },
        })
      )
    }
  }
