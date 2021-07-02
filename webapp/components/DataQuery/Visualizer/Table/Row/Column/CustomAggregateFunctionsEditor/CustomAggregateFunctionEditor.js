import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import { AggregateFunction } from '@core/survey/aggregateFunction'
import { validateAggregateFunction } from '@core/survey/aggregateFunctionValidator'
import * as StringUtils from '@core/stringUtils'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/store/system'

import { FormItem, Input } from '@webapp/components/form/Input'
import { ButtonCancel, ButtonDelete, ButtonSave } from '@webapp/components'
import { NotificationActions } from '@webapp/store/ui'
import { AggregateFunctionExpressionEditor } from './AggregateFunctionExpressionEditor'

export const CustomAggregateFunctionEditor = (props) => {
  const {
    aggregateFunction: aggregateFunctionParam,
    entityDef,
    nodeDef,
    onCancel,
    onDelete,
    onSave: onSaveParam,
  } = props

  const dispatch = useDispatch()
  const i18n = useI18n()

  const [aggregateFunction, setAggregateFunction] = useState(aggregateFunctionParam)

  const [validation, setValidation] = useState(null)

  const validate = useCallback(async () => {
    const validationUpdated = await validateAggregateFunction({ aggregateFunction, nodeDef })
    setValidation(validationUpdated)
  }, [aggregateFunction, nodeDef])

  useEffect(() => {
    validate()
  }, [validate])

  const updateAggregateFunction = async ({ propName, value }) => {
    const aggregateFunctionUpdated = { ...aggregateFunction, [propName]: value }
    setAggregateFunction(aggregateFunctionUpdated)
    validate()
  }

  const onSave = () => {
    if (Validation.isValid(validation)) {
      onSaveParam(aggregateFunction)
    } else {
      dispatch(NotificationActions.notifyWarning({ key: 'common.formContainsErrorsCannotSave' }))
    }
  }

  const { name, expression, placeholder } = aggregateFunction

  return (
    <div className="form">
      <FormItem label={i18n.t('common.name')}>
        <Input
          validation={Validation.getFieldValidation(AggregateFunction.keys.name)(validation)}
          value={name}
          onChange={(value) =>
            updateAggregateFunction({ propName: AggregateFunction.keys.name, value: StringUtils.normalizeName(value) })
          }
        />
      </FormItem>
      <FormItem label={i18n.t('dataExplorerView.customAggregateFunction.sqlExpression')}>
        <AggregateFunctionExpressionEditor
          entityDef={entityDef}
          nodeDef={nodeDef}
          expression={expression}
          onChange={(value) =>
            updateAggregateFunction({
              propName: AggregateFunction.keys.expression,
              value,
            })
          }
        />
      </FormItem>
      <div className="button-bar">
        <ButtonSave onClick={onSave} />
        <ButtonCancel onClick={() => onCancel(aggregateFunction)} />
        {!placeholder && <ButtonDelete onClick={() => onDelete(aggregateFunction)} />}
      </div>
    </div>
  )
}
