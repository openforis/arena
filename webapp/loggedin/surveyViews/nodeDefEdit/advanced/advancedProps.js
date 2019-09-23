import React from 'react'

import { useI18n } from '../../../../commonComponents/hooks'

import Validation from '../../../../../common/validation/validation'
import NodeDef from '../../../../../common/survey/nodeDef'
import { FormItem } from '../../../../commonComponents/form/input'
import Checkbox from '../../../../commonComponents/form/checkbox'
import NodeDefExpressionsProp from './expressionsProp/nodeDefExpressionsProp'

const AdvancedProps = props => {
  const { nodeDef, validation, nodeDefParent, putNodeDefProp, readOnly } = props

  const nodeDefUuidContext = NodeDef.getUuid(nodeDefParent)

  const i18n = useI18n()

  return (
    <div className="form">
      {
        NodeDef.canHaveDefaultValue(nodeDef) &&
        <>
          <FormItem label={i18n.t('nodeDefEdit.advancedProps.readOnly')}>
            <Checkbox
              checked={NodeDef.isReadOnly(nodeDef)}
              disabled={readOnly || NodeDef.isKey(nodeDef) || NodeDef.isMultiple(nodeDef)}
              validation={Validation.getFieldValidation(NodeDef.propKeys.readOnly)(validation)}
              onChange={checked => putNodeDefProp(nodeDef, NodeDef.propKeys.readOnly, checked)}
            />
          </FormItem>

          <NodeDefExpressionsProp
            nodeDef={nodeDef}
            nodeDefValidation={validation}
            putNodeDefProp={putNodeDefProp}
            label={i18n.t('nodeDefEdit.advancedProps.defaultValues')}
            readOnly={readOnly}
            propName={NodeDef.propKeys.defaultValues}
            nodeDefUuidContext={nodeDefUuidContext}
            canBeConstant={true}
            isBoolean={NodeDef.isBoolean(nodeDef)}
          />
        </>
      }

      <NodeDefExpressionsProp
        nodeDef={nodeDef}
        nodeDefValidation={validation}
        putNodeDefProp={putNodeDefProp}
        label={i18n.t('nodeDefEdit.advancedProps.applicableIf')}
        readOnly={readOnly}
        propName={NodeDef.propKeys.applicable}
        applyIf={false}
        multiple={false}
        nodeDefUuidContext={nodeDefUuidContext}
        isContextParent={true}
      />


    </div>
  )
}

export default AdvancedProps