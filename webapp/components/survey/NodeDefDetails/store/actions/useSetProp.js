import { useDispatch, useSelector } from 'react-redux'

import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'

import { NotificationActions } from '@webapp/store/ui'
import { SurveyState } from '@webapp/store/survey'

import { useValidate } from './useValidate'
import { State } from '../state'

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

export const useSetProp = ({ state, setState }) => {
  const dispatch = useDispatch()
  let survey = useSelector(SurveyState.getSurvey)
  const surveyCycleKey = useSelector(SurveyState.getSurveyCycleKey)
  const validateNodeDef = useValidate({ state, setState })

  return ({ key, value = null, advanced = false }) => {
    const nodeDef = State.getNodeDef(state)

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
      survey = Survey.updateNodeDefLayoutProp({
        surveyCycleKey,
        nodeDef: nodeDefUpdated,
        key: NodeDefLayout.keys.renderType,
        value: NodeDefLayout.renderType.form,
      })(survey)
      nodeDefUpdated = Survey.getNodeDefByUuid(NodeDef.getUuid(nodeDefUpdated))(survey)
    }

    validateNodeDef({ nodeDef: nodeDefUpdated })
  }
}
