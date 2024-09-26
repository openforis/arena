import './ExpressionsProp.scss'

import React, { useCallback } from 'react'
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
    hideAdvanced = false,
    isBoolean = true,
    isContextParent = false,
    info = null,
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
  } = props

  const dispatch = useDispatch()

  const getExpressionIndex = useCallback(
    (expression) => R.findIndex(NodeDefExpression.isEqual(expression), values),
    [values]
  )

  const onDelete = useCallback(
    (expression, callback = null) => {
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
    },
    [dispatch, getExpressionIndex, onChange, values]
  )

  const onUpdate = useCallback(
    (expression, callback = null) => {
      if (NodeDefExpression.isEmpty(expression)) {
        onDelete(expression, callback)
      } else {
        const index = getExpressionIndex(expression)
        const newValues = index >= 0 ? R.update(index, expression, values) : R.append(expression, values)
        onChange(newValues)
        callback?.()
      }
    },
    [getExpressionIndex, onChange, onDelete, values]
  )

  const createExpressionProp = useCallback(
    ({ index, expression, validation }) => (
      <ExpressionProp
        key={index}
        applyIf={applyIf}
        canBeConstant={canBeConstant}
        excludeCurrentNodeDef={excludeCurrentNodeDef}
        expression={expression}
        hideAdvanced={hideAdvanced}
        index={index}
        isBoolean={isBoolean}
        isContextParent={isContextParent}
        mode={mode}
        qualifier={qualifier}
        nodeDefUuidContext={nodeDefUuidContext}
        nodeDefUuidCurrent={nodeDefUuidCurrent}
        onDelete={onDelete}
        onUpdate={onUpdate}
        readOnly={readOnly}
        severity={severity}
        showLabels={showLabels}
        validation={validation}
      />
    ),
    [
      applyIf,
      canBeConstant,
      excludeCurrentNodeDef,
      hideAdvanced,
      isBoolean,
      isContextParent,
      mode,
      nodeDefUuidContext,
      nodeDefUuidCurrent,
      onDelete,
      onUpdate,
      qualifier,
      readOnly,
      severity,
      showLabels,
    ]
  )

  return (
    <FormItem info={info} label={label} className={classNames({ error: Validation.isNotValid(validation) })}>
      <div className="node-def-edit__expressions">
        {values.map((value, index) =>
          createExpressionProp({
            index,
            expression: value,
            validation: Validation.getFieldValidation(index)(validation),
          })
        )}
        {!readOnly &&
          (multiple || R.isEmpty(values)) &&
          createExpressionProp({
            index: values.length,
            expression: NodeDefExpression.createExpressionPlaceholder(),
            validation: {},
          })}
      </div>
    </FormItem>
  )
}

ExpressionsProp.propTypes = {
  applyIf: PropTypes.bool,
  canBeConstant: PropTypes.bool,
  excludeCurrentNodeDef: PropTypes.bool,
  hideAdvanced: PropTypes.bool,
  info: PropTypes.string,
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
