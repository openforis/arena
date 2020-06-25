import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as SurveyValidator from '@core/survey/surveyValidator'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'

import { NotificationActions } from '@webapp/store/ui'
import { SurveyState } from '@webapp/store/survey'

import * as NodeDefState from '../state'

import types from './types'

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
  let survey = SurveyState.getSurvey(state)
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
    survey = Survey.updateLayoutProp(
      surveyCycleKey,
      nodeDefUpdated,
      NodeDefLayout.keys.renderType,
      NodeDefLayout.renderType.form
    )
    nodeDefUpdated = Survey.getNodeDef(NodeDef.getUuid(nodeDefUpdated))(survey)
  }

  const nodeDefValidation = await SurveyValidator.validateNodeDef(survey, nodeDefUpdated)

  setNodeDefState(NodeDefState.assocNodeDefAndValidation(nodeDefUpdated, nodeDefValidation)(nodeDefState))

  dispatch({
    type: types.NODE_DEF_PROPS_UPDATE,
    nodeDef,
  })
}
