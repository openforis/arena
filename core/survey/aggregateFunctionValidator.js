import * as NodeDef from '@core/survey/nodeDef'
import { AggregateFunction } from '@core/survey/aggregateFunction'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

export const validateAggregateFunction = async ({ aggregateFunction, nodeDef }) =>
  Validator.validate(aggregateFunction, {
    [AggregateFunction.keys.name]: [
      Validator.validateRequired(Validation.messageKeys.nameRequired),
      Validator.validateItemPropUniqueness(Validation.messageKeys.nameDuplicate)(
        NodeDef.getAggregateFunctions(nodeDef)
      ),
    ],
    [AggregateFunction.keys.expression]: [
      Validator.validateRequired(Validation.messageKeys.aggregateFunction.expressionRequired),
    ],
  })
