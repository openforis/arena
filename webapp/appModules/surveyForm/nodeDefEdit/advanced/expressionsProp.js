import './expressionsProp.scss'

import React from 'react'
import * as R from 'ramda'

import NodeDef from '../../../../../common/survey/nodeDef'
import NodeDefExpression from '../../../../../common/survey/nodeDefExpression'
import Validator from '../../../../../common/validation/validator'

import { FormItem, Input } from '../../../../commonComponents/form/input'
import ExpressionComponent from '../../../../commonComponents/expression/expression'

const ExpressionProp = ({nodeDefUuid, expression, applyIf, onUpdate, onDelete, readOnly, validation}) => (
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

      <ExpressionComponent nodeDefUuid={nodeDefUuid}
                           query={NodeDefExpression.getExpression(expression)}
                           onChange={expr =>
                             onUpdate(NodeDefExpression.assocExpression(expr)(expression))
                           }/>

    </div>

    {
      applyIf &&
      <div className="expression-item">
        <div className="label">Apply If</div>

        <ExpressionComponent nodeDefUuid={nodeDefUuid}
                             query={NodeDefExpression.getApplyIf(expression)}
                             onChange={expr =>
                               onUpdate(NodeDefExpression.assocApplyIf(expr)(expression))
                             }/>
      </div>
    }

  </div>
)

export class ExpressionsProp extends React.Component {

  constructor (props) {
    super(props)

    this.state = {uiValues: []}
  }

  static getDerivedStateFromProps (props, state) {
    const {values, multiple} = props
    const {uiValues: oldUiValues} = state

    const uiValues = R.clone(values)

    if (R.isEmpty(values) || multiple) {
      const placeholder = R.pipe(
        R.find(NodeDefExpression.isPlaceholder),
        R.defaultTo(NodeDefExpression.createExpressionPlaceholder())
      )(oldUiValues)

      uiValues.push(placeholder)
    }
    return {
      uiValues
    }
  }

  getExpressionIndex (expression) {
    return R.findIndex(R.propEq('uuid', expression.uuid), this.state.uiValues)
  }

  handleValuesUpdate (newValues) {
    this.setState({uiValues: newValues})
    this.props.onChange(R.reject(NodeDefExpression.isPlaceholder, newValues))
  }

  handleDelete (expression) {
    if (window.confirm('Delete this expression?')) {
      const index = this.getExpressionIndex(expression)
      const newValues = R.remove(index, 1, this.state.uiValues)
      this.handleValuesUpdate(newValues)
    }
  }

  handleUpdate (expression) {
    if (NodeDefExpression.isEmpty(expression)) {
      this.handleDelete(expression)
    } else {
      const index = this.getExpressionIndex(expression)
      const newValues = R.update(index, expression, this.state.uiValues)
      this.handleValuesUpdate(newValues)
    }
  }

  render () {
    const {nodeDefUuid, label, readOnly, applyIf, validation} = this.props
    const {uiValues} = this.state

    return (
      <FormItem label={label}>
        <div className="node-def-edit__expressions">
          {
            uiValues.map((value, i) =>
              <ExpressionProp key={i}
                              expression={value}
                              applyIf={applyIf}
                              validation={Validator.getFieldValidation(i)(validation)}
                              onDelete={this.handleDelete.bind(this)}
                              onUpdate={this.handleUpdate.bind(this)}
                              readOnly={readOnly}
                              nodeDefUuid={nodeDefUuid}/>
            )

          }
        </div>
      </FormItem>
    )
  }
}

ExpressionsProp.defaultProps = {
  label: '',
  applyIf: true,
  multiple: true,
  readOnly: false,
  nodeDefUuid: null,
  // array of expressions
  values: [],

  validation: null
}

export const NodeDefExpressionsProp = props => {
  const {nodeDef, nodeDefUuid, propName, validation, label, multiple, applyIf, readOnly, putNodeDefProp} = props

  const values = NodeDef.getProp(propName, [])(nodeDef)

  const onExpressionsUpdate = expressions => {
    putNodeDefProp(
      nodeDef,
      propName,
      R.reject(NodeDefExpression.isPlaceholder, expressions),
      true
    )
  }

  return <ExpressionsProp label={label}
                          readOnly={readOnly}
                          applyIf={applyIf}
                          multiple={multiple}
                          values={values}
                          validation={validation}
                          onChange={onExpressionsUpdate}
                          nodeDefUuid={nodeDefUuid}/>

}

NodeDefExpressionsProp.defaultProps = {
  nodeDef: null,
  nodeDefUuid: null,
  propName: null,
  label: '',

  applyIf: true,
  multiple: true,
  readOnly: false,

  validation: null
}