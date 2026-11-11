import { useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { AggregateFunction } from '@core/survey/aggregateFunction'
import { validateAggregateFunction } from '@core/survey/aggregateFunctionValidator'
import * as StringUtils from '@core/stringUtils'
import * as Validation from '@core/validation/validation'
import { ViewDataNodeDef } from '@common/model/db'

import { FormItem, Input } from '@webapp/components/form/Input'
import { FormItemWithValidation } from '@webapp/components/form/FormItemWithValidation'
import { ButtonCancel, ButtonDelete, ButtonSave } from '@webapp/components'
import { useSurvey } from '@webapp/store/survey'
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
  const survey = useSurvey()

  const [aggregateFunction, setAggregateFunction] = useState(aggregateFunctionParam)

  const [validation, setValidation] = useState(null)

  const columnNames = useMemo(() => new ViewDataNodeDef(survey, entityDef).columnNodeDefNames, [survey, entityDef])

  useEffect(() => {
    validateAggregateFunction({ aggregateFunction, nodeDef, columnNames })
      .then(setValidation)
      .catch(() => setValidation(null))
  }, [aggregateFunction, nodeDef, columnNames])

  const updateAggregateFunction = ({ propName, value }) => {
    setAggregateFunction({ ...aggregateFunction, [propName]: value })
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
      <FormItem label="common.name">
        <Input
          validation={Validation.getFieldValidation(AggregateFunction.keys.name)(validation)}
          value={name}
          onChange={(value) =>
            updateAggregateFunction({ propName: AggregateFunction.keys.name, value: StringUtils.normalizeName(value) })
          }
        />
      </FormItem>
      <FormItemWithValidation
        label="dataExplorerView.customAggregateFunction.sqlExpression"
        validation={Validation.getFieldValidation(AggregateFunction.keys.expression)(validation)}
      >
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
      </FormItemWithValidation>
      <div className="button-bar">
        <ButtonSave onClick={onSave} />
        <ButtonCancel onClick={() => onCancel(aggregateFunction)} />
        {!placeholder && <ButtonDelete onClick={() => onDelete(aggregateFunction)} />}
      </div>
    </div>
  )
}

CustomAggregateFunctionEditor.propTypes = {
  aggregateFunction: PropTypes.object.isRequired,
  entityDef: PropTypes.object.isRequired,
  nodeDef: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
}
