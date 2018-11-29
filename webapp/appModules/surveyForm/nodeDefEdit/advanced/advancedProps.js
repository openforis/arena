import React from 'react'

import ExpressionsProp from './expressionsProp'

const AdvancedProps = props => {
  const {nodeDef, putNodeDefProp, readOnly} = props

  return (
    <div className="form">

      <ExpressionsProp nodeDef={nodeDef}
                       putNodeDefProp={putNodeDefProp}
                       label="Default values"
                       readOnly={readOnly}
                       propName="defaultValues"/>

      <ExpressionsProp nodeDef={nodeDef}
                       putNodeDefProp={putNodeDefProp}
                       label="Calculated values"
                       readOnly={readOnly}
                       propName="calculatedValues"/>

      <ExpressionsProp nodeDef={nodeDef}
                       putNodeDefProp={putNodeDefProp}
                       label="Applicable if"
                       readOnly={readOnly}
                       propName="applicable"
                       applyIf={false}
                       multiple={false}/>


    </div>
  )
}

export default AdvancedProps