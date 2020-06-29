import React from 'react'
import PropTypes from 'prop-types'

import * as Validation from '@core/validation/validation'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'

import { FormItem } from '@webapp/components/form/input'
import Checkbox from '@webapp/components/form/checkbox'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import NodeDefExpressionsProp from './ExpressionsProp/NodeDefExpressionsProp'
import { NodeDefState } from './store'

const AdvancedProps = (props) => {
  const { nodeDefState, actions } = props

  const readOnly = !useAuthCanEditSurvey()

  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const validation = NodeDefState.getValidation(nodeDefState)
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
              onChange={(checked) => actions.setProp(NodeDef.propKeys.readOnly, checked)}
            />
          </FormItem>

          <NodeDefExpressionsProp
            nodeDefState={nodeDefState}
            actions={actions}
            label={i18n.t('nodeDefEdit.advancedProps.defaultValues')}
            readOnly={readOnly}
            propName={NodeDef.keysPropsAdvanced.defaultValues}
            nodeDefUuidContext={nodeDefUuidContext}
            canBeConstant
            isBoolean={NodeDef.isBoolean(nodeDef)}
          />
        </>
      )}

      <NodeDefExpressionsProp
        nodeDefState={nodeDefState}
        actions={actions}
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
  nodeDefState: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
}

export default AdvancedProps
