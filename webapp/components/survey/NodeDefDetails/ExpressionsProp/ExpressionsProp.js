import './ExpressionsProp.scss'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import * as R from 'ramda'
import { useDispatch } from 'react-redux'

import * as Expression from '@core/expressionParser/expression'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Validation from '@core/validation/validation'

import { FormItem } from '@webapp/components/form/Input'
import { DialogConfirmActions } from '@webapp/store/ui'

import ExpressionProp from './ExpressionProp'

const ExpressionsProp = (props) => {
  const { excludeCurrentNodeDef, label, multiple, onChange, qualifier, validation, values } = props

  const dispatch = useDispatch()

  const getExpressionIndex = (expression) => R.findIndex(NodeDefExpression.isEqual(expression), values)

  const onDelete = (expression, callback = null) => {
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'nodeDefEdit.expressionsProp.confirmDelete',
        onOk: () => {
          const index = getExpressionIndex(expression)
          const newValues = R.remove(index, 1, values)
          onChange(newValues)
          callback?.()
        },
      })
    )
  }

  const onUpdate = (expression, callback = null) => {
    if (NodeDefExpression.isEmpty(expression)) {
      onDelete(expression, callback)
    } else {
      const index = getExpressionIndex(expression)
      const newValues = index >= 0 ? R.update(index, expression, values) : R.append(expression, values)
      onChange(newValues)
      callback?.()
    }
  }

  return (
    <FormItem label={label} className={classNames({ error: Validation.isNotValid(validation) })}>
      <div className="node-def-edit__expressions">
        {values.map((value, i) => (
          <ExpressionProp
            key={i}
            {...props}
            excludeCurrentNodeDef={excludeCurrentNodeDef}
            qualifier={qualifier}
            index={i}
            expression={value}
            validation={Validation.getFieldValidation(i)(validation)}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        ))}

        {(multiple || R.isEmpty(values)) && (
          <ExpressionProp
            {...props}
            excludeCurrentNodeDef={excludeCurrentNodeDef}
            qualifier={qualifier}
            index={values.length}
            expression={NodeDefExpression.createExpressionPlaceholder()}
            validation={{}}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        )}
      </div>
    </FormItem>
  )
}

ExpressionsProp.propTypes = {
  qualifier: PropTypes.string.isRequired, // used to generate test ids
  values: PropTypes.array, // Array of expressions
  label: PropTypes.string,
  validation: PropTypes.object,
  multiple: PropTypes.bool,
  excludeCurrentNodeDef: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
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
  excludeCurrentNodeDef: true,
  values: [],

  validation: null,

  isContextParent: false,
  canBeConstant: false,
  isBoolean: true,
}

export default ExpressionsProp
