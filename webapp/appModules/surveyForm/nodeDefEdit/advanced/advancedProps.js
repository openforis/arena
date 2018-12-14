import React from 'react'

import { NodeDefExpressionsProp } from './expressionsProp'

import Validator from '../../../../../common/validation/validator'

const AdvancedProps = props => {
  const {nodeDef, putNodeDefProp, readOnly} = props

  const {validation} = nodeDef

  return (
    <div className="form">

      <NodeDefExpressionsProp nodeDef={nodeDef}
                              putNodeDefProp={putNodeDefProp}
                              label="Default values"
                              readOnly={readOnly}
                              propName="defaultValues"
                              validation={Validator.getFieldValidation('defaultValues')(validation)}/>

      <NodeDefExpressionsProp nodeDef={nodeDef}
                              putNodeDefProp={putNodeDefProp}
                              label="Calculated values"
                              readOnly={readOnly}
                              propName="calculatedValues"
                              validation={Validator.getFieldValidation('calculatedValues')(validation)}/>

      <NodeDefExpressionsProp nodeDef={nodeDef}
                              putNodeDefProp={putNodeDefProp}
                              label="Applicable if"
                              readOnly={readOnly}
                              propName="applicable"
                              applyIf={false}
                              multiple={false}
                              validation={Validator.getFieldValidation('applicable')(validation)}/>


    </div>
  )
}

export default AdvancedProps