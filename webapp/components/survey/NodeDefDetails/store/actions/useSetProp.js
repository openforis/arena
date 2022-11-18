import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'

import { NotificationActions } from '@webapp/store/ui'
import { SurveyState } from '@webapp/store/survey'

import { useValidate } from './useValidate'
import { State } from '../state'

const _checkCanChangeProp = ({ dispatch, nodeDef, key, value }) => {
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

const _onUpdateMultiple = ({ survey, surveyCycleKey, nodeDef, value: multiple }) => {
  // Reset validations required or count
  const validations = NodeDef.getValidations(nodeDef)
  const validationsUpdated = multiple
    ? NodeDefValidations.dissocRequired(validations)
    : NodeDefValidations.dissocCount(validations)
  const nodeDefUpdated = NodeDef.assocValidations(validationsUpdated)(nodeDef)

  if (NodeDef.isEntity(nodeDefUpdated) && !multiple && NodeDefLayout.isRenderTable(surveyCycleKey)(nodeDefUpdated)) {
    const nodeDefsUpdated = Survey.updateLayoutProp({
      surveyCycleKey,
      nodeDef: nodeDefUpdated,
      key: NodeDefLayout.keys.renderType,
      value: NodeDefLayout.renderType.form,
    })(survey)
    return nodeDefsUpdated[nodeDef.uuid]
  }
  return nodeDefUpdated
}

const _onUpdateCategoryUuid = ({ nodeDef }) => {
  // Reset parent code if changing category uuid
  return NodeDef.mergeProps({ [NodeDef.propKeys.parentCodeDefUuid]: null })(nodeDef)
}

const _onUpdateReadOnly = ({ nodeDef, value: readOnly }) => {
  if (!readOnly) {
    // dissoc properties valid only when readOnly is true
    return NodeDef.dissocProp(NodeDef.propKeys.hidden)(nodeDef)
  }
  return nodeDef
}

const updateFunctionByProp = {
  [NodeDef.propKeys.categoryUuid]: _onUpdateCategoryUuid,
  [NodeDef.propKeys.multiple]: _onUpdateMultiple,
  [NodeDef.propKeys.readOnly]: _onUpdateReadOnly,
}

export const useSetProp = ({ setState }) => {
  const dispatch = useDispatch()
  const survey = useSelector(SurveyState.getSurvey)
  const surveyCycleKey = useSelector(SurveyState.getSurveyCycleKey)
  const validateNodeDef = useValidate({ setState })

  return useCallback(({ state, key, value = null }) => {
    const nodeDef = State.getNodeDef(state)

    if (!_checkCanChangeProp({ dispatch, nodeDef, key, value })) {
      return
    }

    let nodeDefUpdated = NodeDef.assocProp({ key, value })(nodeDef)

    const propUpdater = updateFunctionByProp[key]
    if (propUpdater) {
      nodeDefUpdated = propUpdater({ survey, surveyCycleKey, nodeDef: nodeDefUpdated, value })
    }

    validateNodeDef({ state, nodeDefUpdated })
  }, [])
}
