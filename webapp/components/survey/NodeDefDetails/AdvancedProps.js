import React from 'react'
import PropTypes from 'prop-types'

import * as Validation from '@core/validation/validation'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'

import { FormItem } from '@webapp/components/form/Input'
import Checkbox from '@webapp/components/form/checkbox'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import NodeDefExpressionsProp from './ExpressionsProp/NodeDefExpressionsProp'
import { State } from './store'

const AdvancedProps = (props) => {
  const { state, Actions } = props

  const readOnly = !useAuthCanEditSurvey()

  const nodeDef = State.getNodeDef(state)
  const validation = State.getValidation(state)
  const nodeDefUuidContext = NodeDef.getParentUuid(nodeDef)

  const i18n = useI18n()

  return (
    <div className="form">
      {NodeDef.canHaveDefaultValue(nodeDef) && (
        <>
          <FormItem label={i18n.t('nodeDefEdit.advancedProps.readOnly')}>
            <Checkbox
              checked={NodeDef.isReadOnly(nodeDef)}
              disabled={readOnly || NodeDef.isKey(nodeDef) || NodeDef.isMultiple(nodeDef)}
              validation={Validation.getFieldValidation(NodeDef.propKeys.readOnly)(validation)}
              onChange={(value) => Actions.setProp({ state, key: NodeDef.propKeys.readOnly, value })}
            />
          </FormItem>

          <NodeDefExpressionsProp
            state={state}
            Actions={Actions}
            label={i18n.t('nodeDefEdit.advancedProps.defaultValues')}
            readOnly={readOnly}
            propName={NodeDef.keysPropsAdvanced.defaultValues}
            nodeDefUuidContext={nodeDefUuidContext}
            canBeConstant
          />
        </>
      )}

      <NodeDefExpressionsProp
        state={state}
        Actions={Actions}
        label={i18n.t('nodeDefEdit.advancedProps.relevantIf')}
        readOnly={readOnly}
        propName={NodeDef.keysPropsAdvanced.applicable}
        applyIf={false}
        multiple={false}
        nodeDefUuidContext={nodeDefUuidContext}
        isContextParent
        hideAdvanced
      />
    </div>
  )
}

AdvancedProps.propTypes = {
  state: PropTypes.object.isRequired,
  Actions: PropTypes.object.isRequired,
}

export default AdvancedProps
