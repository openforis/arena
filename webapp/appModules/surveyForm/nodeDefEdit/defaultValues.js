import './defaultValues.scss'

import React from 'react'
import * as R from 'ramda'

import { Input } from '../../../commonComponents/form/input'

import NodeDef from '../../../../common/survey/nodeDef'
import NodeDefExpression from '../../../../common/survey/nodeDefExpression'

const DefaultValueRow = ({defaultValue, onUpdate, onDelete, readOnly}) =>
  <div className="table__row">
    <div>
      <Input value={NodeDefExpression.getExpression(defaultValue)}
             onValueChange={value => onUpdate(NodeDefExpression.assocExpression(value)(defaultValue))}/>
    </div>
    <div>
      <Input value={NodeDefExpression.getApplyIf(defaultValue)}
             onValueChange={value => onUpdate(NodeDefExpression.assocApplyIf(value)(defaultValue))}/>
    </div>
    <div>
      {!defaultValue.placeholder &&
      <button className="btn btn-of-light"
              aria-disabled={readOnly}
              onClick={() => onDelete(defaultValue)}>
        <span className="icon icon-cross icon-14px"/>
      </button>
      }
    </div>
  </div>

const onDefaultValueUpdate = (nodeDef, defaultValues, defaultValue, putNodeDefProp) => {
  const updatedDefaultValue = R.dissoc('placeholder', defaultValue)
  const newDefaultValues = R.pipe(
    R.update(R.findIndex(R.propEq('uuid', defaultValue.uuid))(defaultValues), updatedDefaultValue),
    R.reject(R.propEq('placeholder', true)),
  )(defaultValues)
  putNodeDefProp(nodeDef, 'defaultValues', newDefaultValues, true)
}

const onDefaultValueDelete = (nodeDef, defaultValues, defaultValue, putNodeDefProp) => {
  if (window.confirm('Delete this default value?')) {
    const newDefaultValues = R.pipe(
      R.remove(R.findIndex(R.propEq('uuid', defaultValue.uuid))(defaultValues), 1),
      R.reject(R.propEq('placeholder', true)),
    )(defaultValues)
    putNodeDefProp(nodeDef, 'defaultValues', newDefaultValues, true)
  }
}

const DefaultValues = props => {
  const {
    nodeDef,
    putNodeDefProp,
  } = props

  const defaultValues = NodeDef.getDefaultValues(nodeDef)
  const uiDefaultValues = R.append(NodeDefExpression.createExpressionPlaceholder(), defaultValues)

  return (
    <div className="table default-values">

      <h5>Default values</h5>

      <div className="table__row-header">
        <div>Value</div>
        <div>If</div>
        <div/>
      </div>

      <div className="table__rows">
        {
          uiDefaultValues.map(defaultValue =>
            <DefaultValueRow {...props}
                             key={defaultValue.uuid}
                             defaultValue={defaultValue}
                             onDelete={defaultValue => onDefaultValueDelete(nodeDef, uiDefaultValues, defaultValue, putNodeDefProp)}
                             onUpdate={defaultValue => onDefaultValueUpdate(nodeDef, uiDefaultValues, defaultValue, putNodeDefProp)}
            />
          )
        }
      </div>
    </div>
  )
}

export default DefaultValues