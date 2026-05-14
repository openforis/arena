import React from 'react'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import * as Validation from '@core/validation/validation'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useSurveyCycleKey } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import { FormItem, Input } from '@webapp/components/form/Input'
import Checkbox from '@webapp/components/form/checkbox'
import Radiobox from '@webapp/components/form/radiobox'

import NodeDefExpressionsProp from './ExpressionsProp/NodeDefExpressionsProp'
import { State } from './store'
import { useSystemConfigExperimentalFeatures } from '@webapp/store/system'

const AdvancedProps = (props) => {
  const { state, Actions } = props

  const experimentalFeatures = useSystemConfigExperimentalFeatures()
  const readOnly = !useAuthCanEditSurvey()
  const cycle = useSurveyCycleKey()

  const nodeDef = State.getNodeDef(state)
  const validation = State.getValidation(state)
  const nodeDefUuidContext = NodeDef.getParentUuid(nodeDef)
  const autoIncrementalKey = NodeDef.isAutoIncrementalKey(nodeDef)
  const defaultValueEvaluatedOneTime = NodeDef.isDefaultValueEvaluatedOneTime(nodeDef)
  const hiddenWhenNotRelevant = NodeDefLayout.isHiddenWhenNotRelevant(cycle)(nodeDef)

  // --- Default Values Radio Logic ---
  const defaultValuesDefined = Objects.isNotEmpty(NodeDef.getDefaultValues(nodeDef))
  const [defaultValuesMode, setDefaultValuesMode] = React.useState(defaultValuesDefined ? 'defined' : 'none')
  React.useEffect(() => {
    setDefaultValuesMode(defaultValuesDefined ? 'defined' : 'none')
  }, [defaultValuesDefined])

  // --- Relevant If Radio Logic ---
  const relevantIfDefined = Objects.isNotEmpty(NodeDef.getApplicable(nodeDef))
  const [relevantIfMode, setRelevantIfMode] = React.useState(relevantIfDefined ? 'defined' : 'always')
  React.useEffect(() => {
    setRelevantIfMode(relevantIfDefined ? 'defined' : 'always')
  }, [relevantIfDefined])

  return (
    <div className="form">
      {NodeDef.canHaveDefaultValue(nodeDef) && (
        <>
          <FormItem label="nodeDefEdit.advancedProps.readOnly">
            <div className="form-item_body">
              <Checkbox
                checked={NodeDef.isReadOnly(nodeDef)}
                disabled={readOnly || NodeDef.isMultiple(nodeDef)}
                validation={Validation.getFieldValidation(NodeDef.propKeys.readOnly)(validation)}
                onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.readOnly, value })}
              />
              {(NodeDef.canBeHidden(nodeDef) || NodeDef.isHidden(nodeDef)) && (
                <FormItem label="nodeDefEdit.advancedProps.hidden">
                  <Checkbox
                    checked={NodeDef.isHidden(nodeDef)}
                    disabled={readOnly}
                    validation={Validation.getFieldValidation(NodeDef.propKeys.hidden)(validation)}
                    onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.hidden, value })}
                  />
                </FormItem>
              )}
            </div>
          </FormItem>

          <NodeDefExpressionsProp
            qualifier={TestId.nodeDefDetails.defaultValues}
            state={state}
            Actions={Actions}
            info={autoIncrementalKey ? 'nodeDefEdit.advancedProps.defaultValuesNotEditableForAutoIncrementalKey' : null}
            label="nodeDefEdit.advancedProps.defaultValues"
            readOnly={readOnly || autoIncrementalKey}
            propName={NodeDef.keysPropsAdvanced.defaultValues}
            nodeDefUuidContext={nodeDefUuidContext}
            canBeConstant
            isBoolean={NodeDef.isBoolean(nodeDef)}
            excludeCurrentNodeDef
            radioMode
            radioLabels={{
              none: 'nodeDefEdit.advancedProps.defaultValuesRadioNone',
              defined: 'nodeDefEdit.advancedProps.defaultValuesRadioDefined',
            }}
          >
            {(defaultValueEvaluatedOneTime || Objects.isNotEmpty(NodeDef.getDefaultValues(nodeDef))) && (
              <div className="form_row without-label">
                <Checkbox
                  checked={defaultValueEvaluatedOneTime}
                  disabled={readOnly || autoIncrementalKey}
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
        </>
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
        isContextParent
        label="nodeDefEdit.advancedProps.relevantIf"
        excludeCurrentNodeDef
        radioMode
        radioLabels={{
          none: 'nodeDefEdit.advancedProps.relevantIfRadioNone',
          defined: 'nodeDefEdit.advancedProps.relevantIfRadioDefined',
        }}
      >
        {(hiddenWhenNotRelevant || Objects.isNotEmpty(NodeDef.getApplicable(nodeDef))) && (
          <div className="form_row without-label">
            <Checkbox
              checked={hiddenWhenNotRelevant}
              disabled={readOnly}
              label="nodeDefEdit.advancedProps.hiddenWhenNotRelevant"
              validation={Validation.getFieldValidation(NodeDefLayout.keys.hiddenWhenNotRelevant)(validation)}
              onChange={(value) =>
                Actions.setLayoutProp({ state, key: NodeDefLayout.keys.hiddenWhenNotRelevant, value })
              }
            />
          </div>
        )}
      </NodeDefExpressionsProp>

      {(NodeDef.isCode(nodeDef) || NodeDef.isTaxon(nodeDef)) && (
        <FormItem label="nodeDefEdit.advancedProps.itemsFilter" info="nodeDefEdit.advancedProps.itemsFilterInfo">
          <Input
            onChange={(value) => Actions.setProp({ state, key: NodeDef.keysPropsAdvanced.itemsFilter, value })}
            validation={Validation.getFieldValidation(NodeDef.keysPropsAdvanced.itemsFilter)(validation)}
            value={NodeDef.getItemsFilter(nodeDef)}
          />
        </FormItem>
      )}
      {experimentalFeatures && NodeDef.canBeHiddenInReport(nodeDef) && (
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
