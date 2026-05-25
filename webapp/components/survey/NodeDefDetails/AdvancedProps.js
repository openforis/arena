import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import * as Validation from '@core/validation/validation'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useSurveyCycleKey } from '@webapp/store/survey'
import { useSystemConfigExperimentalFeatures } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { FormItem, Input } from '@webapp/components/form/Input'
import Checkbox from '@webapp/components/form/checkbox'

import NodeDefExpressionsProp from './ExpressionsProp/NodeDefExpressionsProp'
import { State } from './store'

const editableIfRadioModes = {
  none: 'none',
  defined: 'defined',
  readOnly: 'readOnly',
}

const visibleIfRadioModes = {
  none: 'none',
  defined: 'defined',
  hiddenWhenNotRelevant: 'hiddenWhenNotRelevant',
  alwaysHidden: 'alwaysHidden',
}

const getEditableIfRadioModes = ({ nodeDef }) =>
  NodeDef.isAttribute(nodeDef)
    ? Object.values(editableIfRadioModes)
    : [editableIfRadioModes.none, editableIfRadioModes.defined]

const canSetAlwaysHiddenMode = ({ nodeDef }) =>
  NodeDef.isAttribute(nodeDef) &&
  NodeDef.isReadOnly(nodeDef) &&
  (NodeDef.canBeHidden(nodeDef) || NodeDef.isHidden(nodeDef))

const getVisibleIfRadioModes = ({ nodeDef, hasRelevantIfRule }) => {
  const radioModes = [visibleIfRadioModes.none, visibleIfRadioModes.defined]

  if (hasRelevantIfRule) {
    radioModes.push(visibleIfRadioModes.hiddenWhenNotRelevant)
  }

  if (canSetAlwaysHiddenMode({ nodeDef })) {
    radioModes.push(visibleIfRadioModes.alwaysHidden)
  }

  return radioModes
}

const AdvancedProps = (props) => {
  const { state, Actions } = props

  const experimentalFeatures = useSystemConfigExperimentalFeatures()
  const readOnly = !useAuthCanEditSurvey()
  const cycle = useSurveyCycleKey()

  const nodeDef = useMemo(() => State.getNodeDef(state), [state])

  const validation = State.getValidation(state)

  const nodeDefUuidContext = NodeDef.getParentUuid(nodeDef)
  const autoIncrementalKey = NodeDef.isAutoIncrementalKey(nodeDef)
  const defaultValueEvaluatedOneTime = NodeDef.isDefaultValueEvaluatedOneTime(nodeDef)
  const hiddenWhenNotRelevant = NodeDefLayout.isHiddenWhenNotRelevant(cycle)(nodeDef)
  const hasRelevantIfRule = Objects.isNotEmpty(NodeDef.getApplicable(nodeDef))

  const onEditableIfModeChange = useCallback(
    (mode) => {
      if (mode === editableIfRadioModes.none || mode === editableIfRadioModes.readOnly) {
        Actions.setProp({ state, key: NodeDef.keysPropsAdvanced.editableIf, value: [] })
      }
      Actions.setProp({ state, key: NodeDef.propKeys.readOnly, value: mode === editableIfRadioModes.readOnly })
    },
    [Actions, state]
  )

  const determineEditableIfMode = useCallback(() => {
    const editableIfValues = NodeDef.getEditableIf(nodeDef)
    if (Objects.isNotEmpty(editableIfValues)) {
      return editableIfRadioModes.defined
    }
    if (NodeDef.isAttribute(nodeDef) && NodeDef.isReadOnly(nodeDef)) {
      return editableIfRadioModes.readOnly
    }
    return editableIfRadioModes.none
  }, [nodeDef])

  const onVisibleIfModeChange = useCallback(
    (mode) => {
      if (
        mode === visibleIfRadioModes.none ||
        mode === visibleIfRadioModes.alwaysHidden ||
        mode === visibleIfRadioModes.hiddenWhenNotRelevant
      ) {
        Actions.setProp({ state, key: NodeDef.keysPropsAdvanced.visibleIf, value: [] })
      }
      Actions.setProp({ state, key: NodeDef.propKeys.hidden, value: mode === visibleIfRadioModes.alwaysHidden })
      Actions.setLayoutProp({
        state,
        key: NodeDefLayout.keys.hiddenWhenNotRelevant,
        value: mode === visibleIfRadioModes.hiddenWhenNotRelevant,
      })
    },
    [Actions, state]
  )

  const determineVisibleIfMode = useCallback(() => {
    const visibleIfValues = NodeDef.getPropAdvanced(NodeDef.keysPropsAdvanced.visibleIf, [])(nodeDef)
    if (Objects.isNotEmpty(visibleIfValues)) {
      return visibleIfRadioModes.defined
    }
    if (canSetAlwaysHiddenMode({ nodeDef }) && NodeDef.isHidden(nodeDef)) {
      return visibleIfRadioModes.alwaysHidden
    }
    if (hasRelevantIfRule && hiddenWhenNotRelevant) {
      return visibleIfRadioModes.hiddenWhenNotRelevant
    }
    return visibleIfRadioModes.none
  }, [hasRelevantIfRule, hiddenWhenNotRelevant, nodeDef])

  return (
    <div className="form">
      {experimentalFeatures && (
        <NodeDefExpressionsProp
          Actions={Actions}
          excludeCurrentNodeDef
          info="nodeDefEdit.advancedProps.editableIfInfo"
          isContextParent
          label="nodeDefEdit.advancedProps.editableIf"
          nodeDefUuidContext={nodeDefUuidContext}
          propName={NodeDef.keysPropsAdvanced.editableIf}
          qualifier={TestId.nodeDefDetails.editableIf}
          radioMode
          radioModes={getEditableIfRadioModes({ nodeDef })}
          radioModeDefined={editableIfRadioModes.defined}
          radioLabels={{
            [editableIfRadioModes.none]: 'nodeDefEdit.advancedProps.editableAlways',
            [editableIfRadioModes.defined]: 'nodeDefEdit.advancedProps.editableIfConditionIsMet',
            [editableIfRadioModes.readOnly]: 'nodeDefEdit.advancedProps.readOnly',
          }}
          determineRadioMode={determineEditableIfMode}
          onRadioModeChange={onEditableIfModeChange}
          isRadioModeDisabled={({ mode }) =>
            readOnly || (mode === editableIfRadioModes.readOnly && NodeDef.isMultiple(nodeDef))
          }
          readOnly={readOnly}
          state={state}
        />
      )}

      {NodeDef.canHaveDefaultValue(nodeDef) && (
        <NodeDefExpressionsProp
          qualifier={TestId.nodeDefDetails.defaultValues}
          state={state}
          Actions={Actions}
          info={
            autoIncrementalKey
              ? 'nodeDefEdit.advancedProps.defaultValuesNotEditableForAutoIncrementalKey'
              : 'nodeDefEdit.advancedProps.defaultValuesInfo'
          }
          label="nodeDefEdit.advancedProps.defaultValues"
          readOnly={readOnly || autoIncrementalKey}
          propName={NodeDef.keysPropsAdvanced.defaultValues}
          nodeDefUuidContext={nodeDefUuidContext}
          canBeConstant
          isBoolean={NodeDef.isBoolean(nodeDef)}
          excludeCurrentNodeDef
          radioMode
          radioLabels={{
            none: 'nodeDefEdit.advancedProps.defaultValuesNotSpecified',
            defined: 'nodeDefEdit.advancedProps.defaultValuesSpecified',
          }}
        >
          {(defaultValueEvaluatedOneTime || Objects.isNotEmpty(NodeDef.getDefaultValues(nodeDef))) && (
            <div className="form_row without-label">
              <Checkbox
                checked={defaultValueEvaluatedOneTime}
                disabled={readOnly || autoIncrementalKey}
                info="nodeDefEdit.advancedProps.defaultValueEvaluatedOneTimeInfo"
                label="nodeDefEdit.advancedProps.defaultValueEvaluatedOneTime"
                validation={Validation.getFieldValidation(NodeDef.keysPropsAdvanced.defaultValueEvaluatedOneTime)(
                  validation
                )}
                onChange={(value) =>
                  Actions.setProp({ state, key: NodeDef.keysPropsAdvanced.defaultValueEvaluatedOneTime, value })
                }
              />
            </div>
          )}
        </NodeDefExpressionsProp>
      )}

      <NodeDefExpressionsProp
        qualifier={TestId.nodeDefDetails.relevantIf}
        state={state}
        Actions={Actions}
        readOnly={readOnly}
        propName={NodeDef.keysPropsAdvanced.applicable}
        applyIf={false}
        multiple={false}
        nodeDefUuidContext={nodeDefUuidContext}
        info="nodeDefEdit.advancedProps.relevantIfInfo"
        isContextParent
        label="nodeDefEdit.advancedProps.relevantIf"
        excludeCurrentNodeDef
        radioMode
        radioLabels={{
          none: 'nodeDefEdit.advancedProps.relevantIfRadioNone',
          defined: 'nodeDefEdit.advancedProps.relevantIfRadioDefined',
        }}
      />

      {experimentalFeatures && (
        <NodeDefExpressionsProp
          Actions={Actions}
          excludeCurrentNodeDef
          info="nodeDefEdit.advancedProps.visibleIfInfo"
          isContextParent
          label="nodeDefEdit.advancedProps.visibleIf"
          nodeDefUuidContext={nodeDefUuidContext}
          propName={NodeDef.keysPropsAdvanced.visibleIf}
          qualifier={TestId.nodeDefDetails.visibleIf}
          radioMode
          radioModes={getVisibleIfRadioModes({ nodeDef, hasRelevantIfRule })}
          radioModeDefined={visibleIfRadioModes.defined}
          radioLabels={{
            [visibleIfRadioModes.none]: 'nodeDefEdit.advancedProps.visibleAlways',
            [visibleIfRadioModes.defined]: 'nodeDefEdit.advancedProps.visibleIfConditionIsMet',
            [visibleIfRadioModes.hiddenWhenNotRelevant]: 'nodeDefEdit.advancedProps.hiddenWhenNotRelevant',
            [visibleIfRadioModes.alwaysHidden]: 'nodeDefEdit.advancedProps.hidden',
          }}
          determineRadioMode={determineVisibleIfMode}
          onRadioModeChange={onVisibleIfModeChange}
          readOnly={readOnly}
          state={state}
        />
      )}

      {(NodeDef.isCode(nodeDef) || NodeDef.isTaxon(nodeDef)) && (
        <FormItem label="nodeDefEdit.advancedProps.itemsFilter" info="nodeDefEdit.advancedProps.itemsFilterInfo">
          <Input
            onChange={(value) => Actions.setProp({ state, key: NodeDef.keysPropsAdvanced.itemsFilter, value })}
            validation={Validation.getFieldValidation(NodeDef.keysPropsAdvanced.itemsFilter)(validation)}
            value={NodeDef.getItemsFilter(nodeDef)}
          />
        </FormItem>
      )}
      {NodeDef.canBeHiddenInReport(nodeDef) && (
        <FormItem label="nodeDefEdit.advancedProps.hiddenInReport" info="nodeDefEdit.advancedProps.hiddenInReportInfo">
          <Checkbox
            checked={NodeDef.isHiddenInReport(nodeDef)}
            disabled={readOnly}
            validation={Validation.getFieldValidation(NodeDef.keysPropsAdvanced.hiddenInReport)(validation)}
            onChange={(value) => Actions.setProp({ state, key: NodeDef.keysPropsAdvanced.hiddenInReport, value })}
          />
        </FormItem>
      )}
    </div>
  )
}

AdvancedProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default AdvancedProps
