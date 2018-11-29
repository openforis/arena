import './expressionsProp.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import NodeDefExpression from '../../../../../common/survey/nodeDefExpression'
import NodeDef from '../../../../../common/survey/nodeDef'

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

const Expression = ({expression, applyIf, onUpdate, onDelete, readOnly}) => (
  <div className={`node-def-edit__expression${expression.placeholder ? ' placeholder' : ''}`}>

    {
      !expression.placeholder &&
      <button className="btn btn-s btn-transparent btn-delete"
              aria-disabled={readOnly}
              onClick={() => onDelete(expression)}>
        <span className="icon icon-bin2 icon-12px"/>
      </button>
    }

    <div className="expression-item">
      <div className="label">Expression</div>
      <Input value={NodeDefExpression.getExpression(expression)}
             onValueChange={value => onUpdate(NodeDefExpression.assocExpression(value)(expression))}/>
    </div>
    {
      applyIf &&
      <div className="expression-item">
        <div className="label">Apply If</div>
        <Input value={NodeDefExpression.getApplyIf(expression)}
               onValueChange={value => onUpdate(NodeDefExpression.assocApplyIf(value)(expression))}/>
      </div>
    }

  </div>
)

const ExpressionsProp = (props) => {
  const {
    nodeDef, putNodeDefProp,
    label, propName, values, readOnly, applyIf
  } = props

  return (
    <FormItem label={label}>
      <div className="node-def-edit__expressions">
        {
          values.map((value, i) =>
            <Expression key={i}
                        expression={value}
                        applyIf={applyIf}
                        onDelete={value => onDelete(nodeDef, values, value, putNodeDefProp, propName)}
                        onUpdate={value => onUpdate(nodeDef, values, value, putNodeDefProp, propName)}
                        readOnly={readOnly}/>
          )

        }
      </div>
    </FormItem>
  )
}

ExpressionsProp.defaultProps = {
  nodeDef: null,
  putNodeDefProp: null,

  label: '',
  propName: '',
  applyIf: true,
  multiple: true,
  readOnly: false,

  // array of expressions
  values: [],
}

const mapStateToProps = (state, props) => {
  const {
    nodeDef,
    propName,
    multiple = ExpressionsProp.defaultProps.multiple
  } = props

  const values = R.pipe(
    NodeDef.getProp(propName, []),
    R.ifElse(
      values => multiple === true || R.isEmpty(values),
      R.append(NodeDefExpression.createExpressionPlaceholder()),
      R.identity
    )
  )(nodeDef)

  return {
    values
  }
}

export default connect(mapStateToProps)(ExpressionsProp)