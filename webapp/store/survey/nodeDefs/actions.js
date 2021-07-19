import axios from 'axios'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { debounceAction } from '@webapp/utils/reduxUtils'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { DialogConfirmActions } from '@webapp/store/ui/dialogConfirm'
import { NotificationActions } from '@webapp/store/ui/notification'
import { I18nState } from '@webapp/store/system'

import * as SurveyState from '../state'

export const nodeDefCreate = 'survey/nodeDef/create'
export const nodeDefUpdate = 'survey/nodeDef/update'
export const nodeDefDelete = 'survey/nodeDef/delete'
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

export const createNodeDef = (parent, type, props, history) => async (dispatch, getState) => {
  const state = getState()
  const cycle = SurveyState.getSurveyCycleKey(state)

  const nodeDef = NodeDef.newNodeDef(parent, type, [cycle], props)

  dispatch({ type: nodeDefCreate, nodeDef })

  history.push(`${appModuleUri(designerModules.nodeDef)}${NodeDef.getUuid(nodeDef)}/`)

  return nodeDef
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

export const postNodeDef =
  ({ nodeDef }) =>
  async (dispatch, getState) => {
    const state = getState()
    const surveyId = SurveyState.getSurveyId(state)
    const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

    const {
      data: { nodeDefsValidation, nodeDefsUpdated },
    } = await axios.post(`/api/survey/${surveyId}/nodeDef`, { surveyCycleKey, nodeDef })

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
    // exclude self-dependencies
    R.without(nodeDefUuid)
  )(survey)

  const nodeDefDependents = nodeDefDependentsUuids
    .map((uuid) => Survey.getNodeDefByUuid(uuid)(survey))
    // exclude dependents that are descendants of the node def being deleted
    .filter((dependent) => !NodeDef.isDescendantOf(nodeDef)(dependent))

  if (R.isEmpty(nodeDefDependents)) {
    return true
  }

  const nodeDefDependentsText = nodeDefDependents
    .map((dependent) => `${NodeDef.getLabel(dependent, i18n.lang)} (${NodeDef.getName(dependent)})`)
    .join(', ')

  dispatch(
    NotificationActions.notifyWarning({
      key: 'nodeDefEdit.cannotDeleteNodeDefReferenced',
      params: {
        nodeDef: NodeDef.getLabel(nodeDef, i18n.lang),
        nodeDefDependents: nodeDefDependentsText,
      },
    })
  )
  return false
}

export const removeNodeDef =
  (nodeDef, history = null) =>
  async (dispatch, getState) => {
    const state = getState()
    const survey = SurveyState.getSurvey(state)

    const nodeDefUuid = NodeDef.getUuid(nodeDef)

    if (dispatch(_checkCanRemoveNodeDef(nodeDef))) {
      dispatch(
        DialogConfirmActions.showDialogConfirm({
          key: 'surveyForm.nodeDefEditFormActions.confirmDelete',
          params: { name: NodeDef.getName(nodeDef)},
          onOk: async () => {
            const surveyId = Survey.getId(survey)
            const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

            const [
              {
                data: { nodeDefsUpdated, nodeDefsValidation },
              },
            ] = await Promise.all([
              axios.delete(`/api/survey/${surveyId}/nodeDef/${nodeDefUuid}`, { params: { surveyCycleKey } }),
              dispatch({ type: nodeDefDelete, nodeDef }),
            ])

            dispatch(_onNodeDefsUpdate(nodeDefsUpdated, nodeDefsValidation))
            if (history) {
              history.goBack()
            }
          },
        })
      )
    }
  }
