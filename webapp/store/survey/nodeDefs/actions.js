import axios from 'axios'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { appModuleUri, designerModules } from '@webapp/app/appModules'

import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'
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
