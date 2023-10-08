import React from 'react'
import PropTypes from 'prop-types'

import * as Validation from '@core/validation/validation'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useSurveyCycleKey } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import { ButtonIconInfo } from '@webapp/components/buttons'
import { FormItem, Input } from '@webapp/components/form/Input'
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
            <div className="form-item_body">
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
          <FormItem label={i18n.t('nodeDefEdit.advancedProps.hiddenInMobile')}>
            <Checkbox
              checked={NodeDefLayout.isHiddenInMobile(cycle)(nodeDef)}
              disabled={readOnly}
              validation={Validation.getFieldValidation(NodeDefLayout.keys.hiddenInMobile)(validation)}
              onChange={(value) => Actions.setLayoutProp({ state, key: NodeDefLayout.keys.hiddenInMobile, value })}
            />
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
          <div className="form_row without-label">
            <Checkbox
              checked={NodeDef.isDefaultValueEvaluatedOneTime(nodeDef)}
              disabled={readOnly}
              label="nodeDefEdit.advancedProps.defaultValueEvaluatedOneTime"
              validation={Validation.getFieldValidation(NodeDef.keysPropsAdvanced.defaultValueEvaluatedOneTime)(
                validation
              )}
              onChange={(value) =>
                Actions.setProp({ state, key: NodeDef.keysPropsAdvanced.defaultValueEvaluatedOneTime, value })
              }
            />
          </div>
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

      <div className="form_row without-label">
        <Checkbox
          checked={NodeDefLayout.isHiddenWhenNotRelevant(cycle)(nodeDef)}
          disabled={readOnly}
          label="nodeDefEdit.advancedProps.hiddenWhenNotRelevant"
          validation={Validation.getFieldValidation(NodeDefLayout.keys.hiddenWhenNotRelevant)(validation)}
          onChange={(value) => Actions.setLayoutProp({ state, key: NodeDefLayout.keys.hiddenWhenNotRelevant, value })}
        />
      </div>

      {(NodeDef.isCode(nodeDef) || NodeDef.isTaxon(nodeDef)) && (
        <FormItem
          label={
            <span>
              {i18n.t('nodeDefEdit.advancedProps.itemsFilter')}
              <ButtonIconInfo title="nodeDefEdit.advancedProps.itemsFilterInfo" />
            </span>
          }
        >
          <Input
            onChange={(value) => Actions.setProp({ state, key: NodeDef.keysPropsAdvanced.itemsFilter, value })}
            validation={Validation.getFieldValidation(NodeDef.keysPropsAdvanced.itemsFilter)(validation)}
            value={NodeDef.getItemsFilter(nodeDef)}
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
