import './ExpressionsProp.scss'

import React from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import * as R from 'ramda'
import classNames from 'classnames'

import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Validation from '@core/validation/validation'
import * as Expression from '@core/expressionParser/expression'

import { DialogConfirmActions } from '@webapp/store/ui'

import { FormItem } from '@webapp/components/form/Input'
import ExpressionProp from './ExpressionProp'

const ExpressionsProp = (props) => {
  const {
    applyIf = true,
    canBeConstant = false,
    excludeCurrentNodeDef = true,
    isBoolean = true,
    isContextParent = false,
    label = '',
    mode = Expression.modes.json,
    multiple = true,
    nodeDefUuidContext = null,
    nodeDefUuidCurrent = null,
    onChange,
    qualifier,
    readOnly = false,
    severity = false,
    showLabels = false,
    validation = null,
    values = [],
    ...otherProps
  } = props

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
            applyIf={applyIf}
            canBeConstant={canBeConstant}
            excludeCurrentNodeDef={excludeCurrentNodeDef}
            index={i}
            isBoolean={isBoolean}
            isContextParent={isContextParent}
            mode={mode}
            qualifier={qualifier}
            expression={value}
            nodeDefUuidContext={nodeDefUuidContext}
            nodeDefUuidCurrent={nodeDefUuidCurrent}
            onDelete={onDelete}
            onUpdate={onUpdate}
            readOnly={readOnly}
            severity={severity}
            showLabels={showLabels}
            validation={Validation.getFieldValidation(i)(validation)}
            {...otherProps}
          />
        ))}

        {(multiple || R.isEmpty(values)) && (
          <ExpressionProp
            applyIf={applyIf}
            canBeConstant={canBeConstant}
            excludeCurrentNodeDef={excludeCurrentNodeDef}
            expression={NodeDefExpression.createExpressionPlaceholder()}
            index={values.length}
            isBoolean={isBoolean}
            isContextParent={isContextParent}
            mode={mode}
            nodeDefUuidContext={nodeDefUuidContext}
            nodeDefUuidCurrent={nodeDefUuidCurrent}
            onDelete={onDelete}
            onUpdate={onUpdate}
            qualifier={qualifier}
            readOnly={readOnly}
            severity={severity}
            showLabels={showLabels}
            validation={{}}
            {...otherProps}
          />
        )}
      </div>
    </FormItem>
  )
}

ExpressionsProp.propTypes = {
  applyIf: PropTypes.bool,
  canBeConstant: PropTypes.bool,
  excludeCurrentNodeDef: PropTypes.bool,
  expression: PropTypes.object.isRequired,
  hideAdvanced: PropTypes.bool,
  isBoolean: PropTypes.bool,
  isContextParent: PropTypes.bool,
  label: PropTypes.string,
  mode: PropTypes.oneOf([Expression.modes.json, Expression.modes.sql]),
  multiple: PropTypes.bool,
  nodeDefUuidContext: PropTypes.string,
  nodeDefUuidCurrent: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  qualifier: PropTypes.string.isRequired, // used to generate test ids
  readOnly: PropTypes.bool,
  severity: PropTypes.bool,
  showLabels: PropTypes.bool,
  validation: PropTypes.object,
  values: PropTypes.array, // Array of expressions
}

export default ExpressionsProp
