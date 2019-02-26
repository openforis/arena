import React from 'react'

import { NodeDefExpressionsProp } from './expressionsProp'

import Validator from '../../../../../common/validation/validator'
import NodeDef from '../../../../../common/survey/nodeDef'
import { FormItem } from '../../../../commonComponents/form/input'
import Checkbox from '../../../../commonComponents/form/checkbox'

const AdvancedProps = props => {
  const { nodeDef, nodeDefParent, putNodeDefProp, readOnly } = props

  const validation = NodeDef.getNodeDefValidation(nodeDef)
  const nodeDefUuidContext = NodeDef.getUuid(nodeDefParent)

  return (
    <div className="form">
      {
        NodeDef.canNodeDefHaveDefaultValue(nodeDef) &&
        <React.Fragment>

          <FormItem label={'readOnly'}>
            <Checkbox checked={NodeDef.isNodeDefReadOnly(nodeDef)}
                      disabled={readOnly || NodeDef.isNodeDefKey(nodeDef) || NodeDef.isNodeDefMultiple(nodeDef)}
                      validation={Validator.getFieldValidation(NodeDef.propKeys.readOnly)(validation)}
                      onChange={checked => putNodeDefProp(nodeDef, NodeDef.propKeys.readOnly, checked)}
                      tooltipErrorPosition="bottom"/>
          </FormItem>

          <NodeDefExpressionsProp nodeDef={nodeDef}
                                  putNodeDefProp={putNodeDefProp}
                                  label="Default values"
                                  readOnly={readOnly}
                                  propName="defaultValues"
                                  validation={Validator.getFieldValidation('defaultValues')(validation)}
                                  nodeDefUuidContext={nodeDefUuidContext}
                                  canBeConstant={true}
                                  isBoolean={NodeDef.isNodeDefBoolean(nodeDef)}/>
        </React.Fragment>
      }

      <NodeDefExpressionsProp nodeDef={nodeDef}
                              putNodeDefProp={putNodeDefProp}
                              label="Applicable if"
                              readOnly={readOnly}
                              propName="applicable"
                              applyIf={false}
                              multiple={false}
                              validation={Validator.getFieldValidation('applicable')(validation)}
                              nodeDefUuidContext={nodeDefUuidContext}
                              isContextParent={true}/>


    </div>
  )
}

export default AdvancedProps