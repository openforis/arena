import './expressionsProp.scss'

import React from 'react'
import * as R from 'ramda'

import NodeDefExpression from '../../../../../../common/survey/nodeDefExpression'
import Validation from '../../../../../../common/validation/validation'

import { FormItem } from '../../../../../commonComponents/form/input'
import ExpressionProp from './expressionProp'
import useI18n from '../../../../../commonComponents/useI18n'

const ExpressionsProp = props => {

  const {
    values, label, validation,
    multiple,
    onChange,
  } = props

  const i18n = useI18n()

  const getExpressionIndex = (expression) => R.findIndex(
    R.propEq('uuid', NodeDefExpression.getUuid(expression))
    , values
  )

  const onDelete = (expression) => {
    if (window.confirm(i18n.t('nodeDefEdit.expressionsProp.confirmDelete'))) {
      const index = getExpressionIndex(expression)
      const newValues = R.remove(index, 1, values)
      onChange(newValues)
    }
  }

  const onUpdate = expression => {
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
      <div className="node-def-edit__expressions">
        {
          values.map((value, i) =>
            <ExpressionProp
              key={i}
              {...props}
              expression={value}
              validation={Validation.getFieldValidation(i)(validation)}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          )
        }

        {
          (multiple || R.isEmpty(values)) &&
          <ExpressionProp
            {...props}
            expression={NodeDefExpression.createExpressionPlaceholder()}
            validation={{}}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        }
      </div>
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