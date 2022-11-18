import React from 'react'
import PropTypes from 'prop-types'

import * as Validation from '@core/validation/validation'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useSurveyCycleKey } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import { FormItem } from '@webapp/components/form/Input'
import Checkbox from '@webapp/components/form/checkbox'
import NodeDefExpressionsProp from './ExpressionsProp/NodeDefExpressionsProp'
import { State } from './store'

const AdvancedProps = (props) => {
  const { state, Actions } = props

  const readOnly = !useAuthCanEditSurvey()

  const nodeDef = State.getNodeDef(state)
  const validation = State.getValidation(state)
  const nodeDefUuidContext = NodeDef.getParentUuid(nodeDef)

  const i18n = useI18n()
  const cycle = useSurveyCycleKey()

  return (
    <div className="form">
      {NodeDef.canHaveDefaultValue(nodeDef) && (
        <>
          <FormItem label={i18n.t('nodeDefEdit.advancedProps.readOnly')}>
            <div className="readonly_row">
              <Checkbox
                checked={NodeDef.isReadOnly(nodeDef)}
                disabled={readOnly || NodeDef.isMultiple(nodeDef)}
                validation={Validation.getFieldValidation(NodeDef.propKeys.readOnly)(validation)}
                onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.readOnly, value })}
              />
              {NodeDef.isReadOnly(nodeDef) && (
                <FormItem label={i18n.t('nodeDefEdit.advancedProps.hidden')}>
                  <Checkbox
                    checked={NodeDef.isHidden(nodeDef)}
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
            label={i18n.t('nodeDefEdit.advancedProps.defaultValues')}
            readOnly={readOnly}
            propName={NodeDef.keysPropsAdvanced.defaultValues}
            nodeDefUuidContext={nodeDefUuidContext}
            canBeConstant
            isBoolean={NodeDef.isBoolean(nodeDef)}
          />

          <FormItem label={i18n.t('nodeDefEdit.advancedProps.defaultValueEvaluatedOneTime')}>
            <Checkbox
              checked={NodeDef.isDefaultValueEvaluatedOneTime(nodeDef)}
              disabled={readOnly}
              validation={Validation.getFieldValidation(NodeDef.keysPropsAdvanced.defaultValueEvaluatedOneTime)(
                validation
              )}
              onChange={(value) =>
                Actions.setProp({ state, key: NodeDef.keysPropsAdvanced.defaultValueEvaluatedOneTime, value })
              }
            />
          </FormItem>
        </>
      )}

      <NodeDefExpressionsProp
        qualifier={TestId.nodeDefDetails.relevantIf}
        state={state}
        Actions={Actions}
        label={i18n.t('nodeDefEdit.advancedProps.relevantIf')}
        readOnly={readOnly}
        propName={NodeDef.keysPropsAdvanced.applicable}
        applyIf={false}
        multiple={false}
        nodeDefUuidContext={nodeDefUuidContext}
        isContextParent
      />

      <FormItem label={i18n.t('nodeDefEdit.advancedProps.hiddenWhenNotRelevant')}>
        <Checkbox
          checked={NodeDefLayout.isHiddenWhenNotRelevant(cycle)(nodeDef)}
          disabled={readOnly}
          validation={Validation.getFieldValidation(NodeDefLayout.keys.hiddenWhenNotRelevant)(validation)}
          onChange={(value) => Actions.setLayoutProp({ state, key: NodeDefLayout.keys.hiddenWhenNotRelevant, value })}
        />
      </FormItem>
    </div>
  )
}

AdvancedProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default AdvancedProps
