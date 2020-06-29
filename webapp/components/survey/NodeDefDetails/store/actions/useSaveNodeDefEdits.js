import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as SurveyValidator from '@core/survey/surveyValidator'

import { LoaderActions, NotificationActions } from '@webapp/store/ui'

import * as SurveyState from '@webapp/store/survey/state'
import * as NodeDefsActions from '@webapp/store/survey/nodeDefs/actions'

import * as NodeDefState from '../state'

// Persists the temporary changes applied to the node def in the state
export const useSaveNodeDefEdits = ({ nodeDefState, setNodeDefState }) => () => async (dispatch, getState) => {
  const state = getState()
  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const validation = NodeDefState.getValidation(nodeDefState)

  if (SurveyValidator.isNodeDefValidationValidOrHasOnlyMissingChildrenErrors(nodeDef, validation)) {
    dispatch(LoaderActions.showLoader())

    const survey = SurveyState.getSurvey(state)
    const surveyCycleKey = SurveyState.getSurveyCycleKey(state)

    const isNodeDefNew = NodeDef.isTemporary(nodeDef)
    const nodeDefCycleKeys = NodeDef.getCycles(nodeDef)
    let nodeDefUpdated = NodeDef.dissocTemporary(nodeDef)

    if (isNodeDefNew) {
      if (nodeDefCycleKeys.length > 1) {
        // copy layout of current cycle to all selected cycles
        nodeDefUpdated = NodeDefLayout.copyLayoutSurveyCycle(surveyCycleKey, nodeDefCycleKeys)(nodeDefUpdated)
      }
      await dispatch(NodeDefsActions.postNodeDef({ nodeDef: nodeDefUpdated }))
    } else {
      const props = NodeDefState.getPropsUpdated(nodeDefState)
      const propsAdvanced = NodeDefState.getPropsAdvancedUpdated(nodeDefState)

      await dispatch(
        NodeDefsActions.putNodeDefProps({
          nodeDefUuid: NodeDef.getUuid(nodeDef),
          parentUuid: NodeDef.getParentUuid(nodeDef),
          props,
          propsAdvanced,
        })
      )
    }

    // Update node def state
    setNodeDefState(NodeDefState.createNodeDefState({ nodeDef: nodeDefUpdated, validation }))

    // Dispatch nodeDefSave action
    dispatch({
      type: NodeDefsActions.nodeDefSave,
      nodeDef: nodeDefUpdated,
      nodeDefParent: Survey.getNodeDefParent(nodeDef)(survey),
      surveyCycleKey,
      nodeDefValidation: validation,
    })

    dispatch(LoaderActions.hideLoader())

    dispatch(NotificationActions.notifyInfo({ key: 'common.saved', timeout: 3000 }))
  } else {
    // Cannot save node def: show notification
    dispatch(NotificationActions.notifyError({ key: 'common.formContainsErrorsCannotSave' }))
  }
}
