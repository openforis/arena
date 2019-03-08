import './expressionsProp.scss'

import React from 'react'
import * as R from 'ramda'

import NodeDef from '../../../../../common/survey/nodeDef'
import NodeDefExpression from '../../../../../common/survey/nodeDefExpression'
import Validator from '../../../../../common/validation/validator'

import { FormItem } from '../../../../commonComponents/form/input'
import ExpressionEditor from '../../../../commonComponents/expression/expressionEditor'
import LabelsEditor from '../../../../survey/components/labelsEditor'
import Tooltip from '../../../../commonComponents/tooltip'

import { getValidationFieldMessages } from '../../../../appUtils/validationUtils'

const ExpressionProp = (props) => {

  const {
    nodeDefUuidContext, nodeDefUuidCurrent, validation,
    expression, applyIf, showLabels, readOnly,
    isContextParent, canBeConstant, isBoolean,
    onUpdate, onDelete
  } = props

  const errorMessages = getValidationFieldMessages(Validator.getFieldValidations(validation))

  return (
    <Tooltip messages={errorMessages} position="bottom" type={!R.isEmpty(errorMessages) ? 'error' : ''}>
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

          <ExpressionEditor nodeDefUuidContext={nodeDefUuidContext}
                            nodeDefUuidCurrent={nodeDefUuidCurrent}
                            query={NodeDefExpression.getExpression(expression)}
                            onChange={expr =>
                              onUpdate(NodeDefExpression.assocExpression(expr)(expression))
                            }
                            isContextParent={isContextParent}
                            canBeConstant={canBeConstant}
                            isBoolean={isBoolean}/>
        </div>

        {
          applyIf &&
          <div className="expression-item">
            <div className="label">Apply If</div>

            <ExpressionEditor nodeDefUuidContext={nodeDefUuidContext}
                              nodeDefUuidCurrent={nodeDefUuidCurrent}
                              query={NodeDefExpression.getApplyIf(expression)}
                              onChange={expr =>
                                onUpdate(NodeDefExpression.assocApplyIf(expr)(expression))
                              }
                              isContextParent={isContextParent}
                              canBeConstant={false}/>
          </div>
        }

        {
          showLabels &&
          <LabelsEditor formLabel="Error message(s)"
                        labels={NodeDefExpression.getMessages(expression)}
                        onChange={labelItem =>
                          onUpdate(NodeDefExpression.assocMessage(labelItem)(expression))
                        }
          />
        }

      </div>
    </Tooltip>
  )
}

export class ExpressionsProp extends React.Component {

  constructor (props) {
    super(props)

    this.state = { uiValues: [] }
  }

  static getDerivedStateFromProps (props, state) {
    const { values, multiple } = props
    const { uiValues: oldUiValues } = state

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
    this.setState({ uiValues: newValues })
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
    const {
      nodeDefUuidContext, nodeDefUuidCurrent,
      label, readOnly, applyIf, showLabels, validation,
      isContextParent, canBeConstant, isBoolean,
    } = this.props
    const { uiValues } = this.state

    return (
      <FormItem label={label}>
        <div className="node-def-edit__expressions">
          {
            uiValues.map((value, i) =>
              <ExpressionProp key={i}
                              expression={value}
                              applyIf={applyIf}
                              showLabels={showLabels}
                              validation={Validator.getFieldValidation(i)(validation)}
                              onDelete={this.handleDelete.bind(this)}
                              onUpdate={this.handleUpdate.bind(this)}
                              readOnly={readOnly}
                              nodeDefUuidContext={nodeDefUuidContext}
                              nodeDefUuidCurrent={nodeDefUuidCurrent}
                              isContextParent={isContextParent}
                              canBeConstant={canBeConstant}
                              isBoolean={isBoolean}/>
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
  showLabels: false,
  multiple: true,
  readOnly: false,
  nodeDefUuidContext: null,
  nodeDefUuidCurrent: null,
  // array of expressions
  values: [],

  validation: null,

  isContextParent: false,
  canBeConstant: false,
  isBoolean: true,
}

export const NodeDefExpressionsProp = props => {
  const {
    nodeDef, nodeDefUuidContext,
    propName, validation, label, multiple, applyIf, showLabels, readOnly, putNodeDefProp,
    isContextParent, canBeConstant, isBoolean,
  } = props

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
                          showLabels={showLabels}
                          validation={validation}
                          onChange={onExpressionsUpdate}
                          nodeDefUuidContext={nodeDefUuidContext}
                          nodeDefUuidCurrent={NodeDef.getUuid(nodeDef)}
                          isContextParent={isContextParent}
                          canBeConstant={canBeConstant}
                          isBoolean={isBoolean}/>

}

NodeDefExpressionsProp.defaultProps = {
  nodeDef: null,
  nodeDefUuidContext: null,
  propName: null,
  label: '',

  applyIf: true,
  showLabels: false,
  multiple: true,
  readOnly: false,

  validation: null,
  isContextParent: false,
  canBeConstant: false,
  isBoolean: true,
}