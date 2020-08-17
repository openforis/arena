import './ExpressionsProp.scss'

import React from 'react'
import { useDispatch } from 'react-redux'
import * as R from 'ramda'

import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Validation from '@core/validation/validation'
import * as Expression from '@core/expressionParser/expression'

import { DialogConfirmActions } from '@webapp/store/ui'

import { FormItem } from '@webapp/components/form/Input'
import ValidationTooltip from '@webapp/components/validationTooltip'
import ExpressionProp from './ExpressionProp'

const ExpressionsProp = (props) => {
  const { values, label, validation, multiple, onChange } = props

  const dispatch = useDispatch()

  const getExpressionIndex = (expression) => R.findIndex(NodeDefExpression.isEqual(expression), values)

  const onDelete = (expression) => {
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'nodeDefEdit.expressionsProp.confirmDelete',
        onOk: () => {
          const index = getExpressionIndex(expression)
          const newValues = R.remove(index, 1, values)
          onChange(newValues)
        },
      })
    )
  }

  const onUpdate = (expression) => {
    if (NodeDefExpression.isEmpty(expression)) {
      onDelete(expression)
    } else {
      const index = getExpressionIndex(expression)
      const newValues = index >= 0 ? R.update(index, expression, values) : R.append(expression, values)
      onChange(newValues)
    }
  }

  return (
    <FormItem label={label}>
      <ValidationTooltip validation={validation} showKeys={false} type={Validation.isValid(validation) ? '' : 'error'}>
        <div className="node-def-edit__expressions">
          {values.map((value, i) => (
            <ExpressionProp
              key={i}
              {...props}
              expression={value}
              validation={Validation.getFieldValidation(i)(validation)}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}

          {(multiple || R.isEmpty(values)) && (
            <ExpressionProp
              {...props}
              expression={NodeDefExpression.createExpressionPlaceholder()}
              validation={{}}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          )}
        </div>
      </ValidationTooltip>
    </FormItem>
  )
}

ExpressionsProp.defaultProps = {
  label: '',
  applyIf: true,
  showLabels: false,
  severity: false,
  multiple: true,
  readOnly: false,
  mode: Expression.modes.json,
  nodeDefUuidContext: null,
  nodeDefUuidCurrent: null,
  // Array of expressions
  values: [],

  validation: null,

  isContextParent: false,
  canBeConstant: false,
  isBoolean: true,
}

export default ExpressionsProp
