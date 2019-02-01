import React from 'react'

import { NodeDefExpressionsProp } from './expressionsProp'

import Validator from '../../../../../common/validation/validator'
import NodeDef from '../../../../../common/survey/nodeDef'

const AdvancedProps = props => {
  const { nodeDef, nodeDefParent, putNodeDefProp, readOnly } = props

  const validation = NodeDef.getNodeDefValidation(nodeDef)
  const nodeDefUuidContext = NodeDef.getUuid(nodeDefParent)

  return (
    <div className="form">


      <NodeDefExpressionsProp nodeDef={nodeDef}
                              putNodeDefProp={putNodeDefProp}
                              label="Calculated values"
                              readOnly={readOnly}
                              propName="calculatedValues"
                              validation={Validator.getFieldValidation('calculatedValues')(validation)}
                              nodeDefUuidContext={nodeDefUuidContext}
                              canBeConstant={true}/>

      {
        NodeDef.canNodeDefHaveDefaultValue(nodeDef) &&

        <NodeDefExpressionsProp nodeDef={nodeDef}
                                putNodeDefProp={putNodeDefProp}
                                label="Default values"
                                readOnly={readOnly}
                                propName="defaultValues"
                                validation={Validator.getFieldValidation('defaultValues')(validation)}
                                nodeDefUuidContext={nodeDefUuidContext}
                                canBeConstant={true}/>
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