import React from 'react'
import PropTypes from 'prop-types'

import * as Validation from '@core/validation/validation'
import * as NodeDef from '@core/survey/nodeDef'

import { useI18n } from '@webapp/store/system'

import { FormItem } from '@webapp/components/form/input'
import Checkbox from '@webapp/components/form/checkbox'

import NodeDefExpressionsProp from './expressionsProp/nodeDefExpressionsProp'

const AdvancedProps = (props) => {
  const { nodeDef, validation, nodeDefParent, setNodeDefProp, readOnly } = props

  const nodeDefUuidContext = NodeDef.getUuid(nodeDefParent)

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
              onChange={(checked) => setNodeDefProp(NodeDef.propKeys.readOnly, checked)}
            />
          </FormItem>

          <NodeDefExpressionsProp
            nodeDef={nodeDef}
            nodeDefValidation={validation}
            setNodeDefProp={setNodeDefProp}
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
        nodeDef={nodeDef}
        nodeDefValidation={validation}
        setNodeDefProp={setNodeDefProp}
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
  nodeDef: PropTypes.object.isRequired,
  nodeDefParent: PropTypes.object.isRequired,
  readOnly: PropTypes.bool,
  setNodeDefProp: PropTypes.func.isRequired,
  validation: PropTypes.object.isRequired,
}

AdvancedProps.defaultProps = {
  readOnly: false,
}

export default AdvancedProps
