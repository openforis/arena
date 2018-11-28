import './expressionProp.scss'

import React from 'react'
import * as R from 'ramda'

import NodeDefExpression from '../../../../../common/survey/nodeDefExpression'

import { FormItem, Input } from '../../../../commonComponents/form/input'

const onUpdate = (nodeDef, values, value, putNodeDefProp, propName) => {
  const updatedValue = R.dissoc('placeholder', value)
  const newValues = R.pipe(
    R.update(R.findIndex(R.propEq('uuid', value.uuid))(values), updatedValue),
    R.reject(R.propEq('placeholder', true)),
  )(values)
  putNodeDefProp(nodeDef, propName, newValues, true)
}

const onDelete = (nodeDef, values, value, putNodeDefProp, propName) => {
  if (window.confirm('Delete this default value?')) {
    const newValues = R.pipe(
      R.remove(R.findIndex(R.propEq('uuid', value.uuid))(values), 1),
      R.reject(R.propEq('placeholder', true)),
    )(values)
    putNodeDefProp(nodeDef, propName, newValues, true)
  }
}

const ExpressionRow = ({defaultValue, onUpdate, onDelete, readOnly}) => (
  <div className={`node-def-edit__expression${defaultValue.placeholder ? ' placeholder' : ''}`}>

    {
      !defaultValue.placeholder &&
      <button className="btn btn-s btn-transparent btn-delete"
              aria-disabled={readOnly}
              onClick={() => onDelete(defaultValue)}>
        <span className="icon icon-bin2 icon-12px"/>
      </button>
    }

    <div className="expression-item">
      <div className="label">Expression</div>
      <Input value={NodeDefExpression.getExpression(defaultValue)}
             onValueChange={value => onUpdate(NodeDefExpression.assocExpression(value)(defaultValue))}/>
    </div>
    <div className="expression-item">
      <div className="label">Apply If</div>
      <Input value={NodeDefExpression.getApplyIf(defaultValue)}
             onValueChange={value => onUpdate(NodeDefExpression.assocApplyIf(value)(defaultValue))}/>
    </div>

  </div>
)

const ExpressionProp = (props) => {
  const {
    nodeDef, putNodeDefProp,
    label, propName, values, readOnly
  } = props

  const uiValues = R.append(NodeDefExpression.createExpressionPlaceholder(), values)

  return (
    <FormItem label={label}>
      <div className="node-def-edit__expressions">
        {
          uiValues.map((value, i) =>
            <ExpressionRow key={i}
                           defaultValue={value}
                           onDelete={value => onDelete(nodeDef, uiValues, value, putNodeDefProp, propName)}
                           onUpdate={value => onUpdate(nodeDef, uiValues, value, putNodeDefProp, propName)}
                           readOnly={readOnly}/>
          )

        }
      </div>
    </FormItem>
  )
}

export default ExpressionProp