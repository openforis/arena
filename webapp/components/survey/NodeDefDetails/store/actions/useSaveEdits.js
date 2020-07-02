import { useDispatch, useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as SurveyValidator from '@core/survey/surveyValidator'

import { LoaderActions, NotificationActions } from '@webapp/store/ui'

import * as SurveyState from '@webapp/store/survey/state'
import * as NodeDefsActions from '@webapp/store/survey/nodeDefs/actions'

import * as State from '../state'

// Persists the temporary changes applied to the node def in the state
export const useSaveEdits = ({ state, setState }) => {
  const dispatch = useDispatch()
  const survey = useSelector(SurveyState.getSurvey)
  const surveyCycleKey = useSelector(SurveyState.getSurveyCycleKey)

  return () => {
    ;(async () => {
      const nodeDef = State.getNodeDef(state)
      const validation = State.getValidation(state)

      // Check that node def can be saved
      if (!SurveyValidator.isNodeDefValidationValidOrHasOnlyMissingChildrenErrors(nodeDef, validation)) {
        // Cannot save node def: show notification
        dispatch(NotificationActions.notifyError({ key: 'common.formContainsErrorsCannotSave' }))
        return
      }

      dispatch(LoaderActions.showLoader())

      const isNodeDefNew = NodeDef.isTemporary(nodeDef)
      const nodeDefCycleKeys = NodeDef.getCycles(nodeDef)
      let nodeDefUpdated = NodeDef.dissocTemporary(nodeDef)

      if (isNodeDefNew) {
        if (nodeDefCycleKeys.length > 1) {
          // copy layout of current cycle to all selected cycles
          nodeDefUpdated = NodeDefLayout.copyLayout({ cycleFrom: surveyCycleKey, cyclesTo: nodeDefCycleKeys })(
            nodeDefUpdated
          )
        }
        await dispatch(NodeDefsActions.postNodeDef({ nodeDef: nodeDefUpdated }))
      } else {
        const props = State.getPropsUpdated(state)
        const propsAdvanced = State.getPropsAdvancedUpdated(state)

        await dispatch(
          NodeDefsActions.putNodeDefProps({
            nodeDefUuid: NodeDef.getUuid(nodeDef),
            parentUuid: NodeDef.getParentUuid(nodeDef),
            props,
            propsAdvanced,
          })
        )
      }

      // Update local node def state
      setState(State.create({ nodeDef: nodeDefUpdated, validation }))

      // Update redux store nodeDefs state
      dispatch(
        NodeDefsActions.saveNodeDef({
          nodeDef: nodeDefUpdated,
          nodeDefParent: Survey.getNodeDefParent(nodeDef)(survey),
          surveyCycleKey,
          nodeDefValidation: validation,
        })
      )

      dispatch(LoaderActions.hideLoader())

      dispatch(NotificationActions.notifyInfo({ key: 'common.saved', timeout: 3000 }))
    })()
  }
}
