import './expressionsProp.scss'

import React from 'react'
import * as R from 'ramda'

import AppContext from '../../../../../app/appContext'
import NodeDefExpression from '../../../../../../common/survey/nodeDefExpression'
import Validator from '../../../../../../common/validation/validator'

import { FormItem } from '../../../../../commonComponents/form/input'
import ExpressionProp from './expressionProp'

class ExpressionsProp extends React.Component {

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
      uiValues,
    }
  }

  getExpressionIndex (expression) {
    return R.findIndex(R.propEq('uuid', NodeDefExpression.getUuid(expression)), this.state.uiValues)
  }

  handleValuesUpdate (newValues) {
    this.setState({ uiValues: newValues })
    this.props.onChange(R.reject(NodeDefExpression.isPlaceholder, newValues))
  }

  handleDelete (expression) {
    const { i18n } = this.context

    if (window.confirm(i18n.t('nodeDefEdit.expressionsProp.confirmDelete'))) {
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
              <ExpressionProp
                key={i}
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

ExpressionsProp.contextType = AppContext

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

export default ExpressionsProp