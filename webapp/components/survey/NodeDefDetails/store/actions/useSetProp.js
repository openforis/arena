import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import * as A from '@core/arena'
import * as StringUtils from '@core/stringUtils'
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
  let nodeDefUpdated = NodeDef.assocValidations(validationsUpdated)(nodeDef)

  if (NodeDef.isEntity(nodeDefUpdated) && !multiple) {
    nodeDefUpdated = NodeDef.dissocEnumerate(nodeDefUpdated)

    if (NodeDefLayout.isRenderTable(surveyCycleKey)(nodeDefUpdated)) {
      const nodeDefsUpdated = Survey.updateLayoutProp({
        surveyCycleKey,
        nodeDef: nodeDefUpdated,
        key: NodeDefLayout.keys.renderType,
        value: NodeDefLayout.renderType.form,
      })(survey)
      nodeDefUpdated = nodeDefsUpdated[nodeDef.uuid]
    }
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

const _generateLabelFromName = (name) => {
  // name is in snake case
  const parts = name.split(/[_|-]/).filter(Boolean)
  if (parts.length > 0) {
    parts[0] = StringUtils.capitalizeFirstLetter(parts[0])
  }
  return parts.join(' ')
}

const _onUpdateName = ({ survey, nodeDef, nodeDefPrev, value: name, lang }) => {
  let nodeDefUpdated = nodeDef
  const prevNameCapitalized = _generateLabelFromName(NodeDef.getName(nodeDefPrev))
  const prevLabel = NodeDef.getLabel(nodeDef, lang, NodeDef.NodeDefLabelTypes.label, false)
  if (StringUtils.isBlank(prevLabel) || prevNameCapitalized === prevLabel) {
    const nameCapitalized = _generateLabelFromName(name)
    nodeDefUpdated = NodeDef.assocLabel({ label: nameCapitalized, lang })(nodeDefUpdated)
  }
  if (NodeDef.isAutoIncrementalKey(nodeDefUpdated)) {
    // re-generate default values; they depend on current node def name
    nodeDefUpdated = _onUpdateAutoIncrementalKey({ survey, nodeDef, value: true })
  }
  return nodeDefUpdated
}

const _onUpdateAutoIncrementalKey = ({ survey, nodeDef, value }) => {
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  const defaultValues = value ? NodeDef.createAutoIncrementalKeyDefaultValues({ nodeDef, nodeDefParent }) : []
  return A.pipe(
    NodeDef.assocDefaultValues(defaultValues),
    NodeDef.assocDefaultValueEvaluatedOnlyOneTime(value)
  )(nodeDef)
}

const updateFunctionByProp = {
  [NodeDef.propKeys.categoryUuid]: _onUpdateCategoryUuid,
  [NodeDef.propKeys.multiple]: _onUpdateMultiple,
  [NodeDef.propKeys.name]: _onUpdateName,
  [NodeDef.propKeys.readOnly]: _onUpdateReadOnly,
  [NodeDef.propKeys.autoIncrementalKey]: _onUpdateAutoIncrementalKey,
}

export const useSetProp = ({ setState }) => {
  const dispatch = useDispatch()
  const survey = useSelector(SurveyState.getSurvey)
  const surveyCycleKey = useSelector(SurveyState.getSurveyCycleKey)
  const lang = useSelector(SurveyState.getSurveyPreferredLang)
  const validateNodeDef = useValidate({ setState })

  return useCallback(({ state, key, value = null }) => {
    const nodeDef = State.getNodeDef(state)

    if (!_checkCanChangeProp({ dispatch, nodeDef, key, value })) {
      return
    }

    let nodeDefUpdated = NodeDef.assocProp({ key, value })(nodeDef)

    const propUpdater = updateFunctionByProp[key]
    if (propUpdater) {
      nodeDefUpdated = propUpdater({
        survey,
        surveyCycleKey,
        lang,
        nodeDef: nodeDefUpdated,
        nodeDefPrev: nodeDef,
        value,
      })
    }

    nodeDefUpdated = NodeDef.clearNotApplicableProps(surveyCycleKey)(nodeDefUpdated)

    validateNodeDef({ nodeDefUpdated })
  }, [])
}
