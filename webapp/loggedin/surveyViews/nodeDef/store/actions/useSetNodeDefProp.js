import * as R from 'ramda'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'

import * as SurveyState from '@webapp/store/survey/state'
import * as NotificationActions from '@webapp/store/ui'

import * as NodeDefState from '../state'
import { updateLayoutProp } from './update'
import { useValidateNodeDef } from './useValidateNodeDef'

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

export const useSetNodeDefProp = ({ nodeDefState, setNodeDefState }) => (key, value = null, advanced = false) => async (
  dispatch,
  getState
) => {
  const state = getState()
  const surveyCycleKey = SurveyState.getSurveyCycleKey(state)
  const nodeDef = NodeDefState.getNodeDef(nodeDefState)

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
      updateLayoutProp(nodeDefUpdated, NodeDefLayout.keys.renderType, NodeDefLayout.renderType.form)
    )
    nodeDefUpdated = NodeDefLayout.assocLayout(layoutUpdated)(nodeDefUpdated)
    props[NodeDefLayout.keys.layout] = layoutUpdated
  }

  const validateNodeDef = useValidateNodeDef({ nodeDefState, setNodeDefState })
  dispatch(validateNodeDef(nodeDefUpdated))
}
