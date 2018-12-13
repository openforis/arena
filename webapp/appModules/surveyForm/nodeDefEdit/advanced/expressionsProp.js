import './expressionsProp.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import NodeDefExpression from '../../../../../common/survey/nodeDefExpression'
import NodeDef from '../../../../../common/survey/nodeDef'
import Validator from '../../../../../common/validation/validator'

import { FormItem, Input } from '../../../../commonComponents/form/input'

const Expression = ({expression, applyIf, onUpdate, onDelete, readOnly, validation}) => (
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
             validation={Validator.getFieldValidation('expression')(validation)}
             onChange={value => onUpdate(NodeDefExpression.assocExpression(value)(expression))}/>
    </div>
    {
      applyIf &&
      <div className="expression-item">
        <div className="label">Apply If</div>
        <Input value={NodeDefExpression.getApplyIf(expression)}
               validation={Validator.getFieldValidation('applyIf')(validation)}
               onChange={value => onUpdate(NodeDefExpression.assocApplyIf(value)(expression))}/>
      </div>
    }

  </div>
)

class ExpressionsProp extends React.Component {

  getExpressionIndex (expression) {
    return R.findIndex(R.propEq('uuid', expression.uuid), this.props.values)
  }

  handleDelete (expression) {
    const {values} = this.props

    if (window.confirm('Delete this default expression?')) {
      const index = this.getExpressionIndex(expression)
      const newValues = R.remove(index, 1, values)
      this.updateExpressions(newValues)
    }
  }

  handleUpdate (expression) {
    if (NodeDefExpression.isEmpty(expression)) {
      this.handleDelete(expression)
    } else {
      const {values} = this.props
      const index = this.getExpressionIndex(expression)
      const newValues = R.update(index, expression, values)
      this.updateExpressions(newValues)
    }
  }

  updateExpressions (expressions) {
    const {nodeDef, putNodeDefProp, propName} = this.props

    putNodeDefProp(
      nodeDef,
      propName,
      R.reject(R.propEq('placeholder', true), expressions),
      true
    )

  }

  render () {
    const {label, readOnly, applyIf, values, validation} = this.props

    return (
      <FormItem label={label}>
        <div className="node-def-edit__expressions">
          {
            values.map((value, i) =>
              <Expression key={i}
                          expression={value}
                          applyIf={applyIf}
                          validation={Validator.getFieldValidation(i)(validation)}
                          onDelete={this.handleDelete.bind(this)}
                          onUpdate={this.handleUpdate.bind(this)}
                          readOnly={readOnly}/>
            )

          }
        </div>
      </FormItem>
    )
  }
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
    values,
    validation: Validator.getFieldValidation(propName)(NodeDef.getNodeDefValidation(nodeDef)),
  }
}

export default connect(mapStateToProps)(ExpressionsProp)