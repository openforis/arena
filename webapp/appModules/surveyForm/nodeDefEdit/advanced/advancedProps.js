import './defaultValues.scss'

import React from 'react'

import NodeDef from '../../../../../common/survey/nodeDef'
import ExpressionProp from './expressionProp'

const AdvancedProps = props => {
  const {nodeDef, putNodeDefProp, readOnly} = props

  return (
    <div className="form">

      <ExpressionProp nodeDef={nodeDef}
                      putNodeDefProp={putNodeDefProp}
                      label="Default values"
                      values={NodeDef.getDefaultValues(nodeDef)}
                      readOnly={readOnly}
                      propName="defaultValues"/>


    </div>
  )
}

export default AdvancedProps