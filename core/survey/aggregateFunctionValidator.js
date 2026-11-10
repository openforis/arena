import * as NodeDef from '@core/survey/nodeDef'
import { AggregateFunction } from '@core/survey/aggregateFunction'
import { AggregateFunctionExpression } from '@core/survey/aggregateFunctionExpression'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

/**
 * Creates a validator of the SQL expression, allowing only the specified columns.
 * @param {string[]} columnNames - The column names that the expression can use.
 * @returns {function(string, object): (object|null)} - The validator function.
 */
const validateExpression = (columnNames) => (propName, aggregateFunction) => {
  const expression = Validator.getProp(propName)(aggregateFunction)
  return expression ? AggregateFunctionExpression.validate({ expression, columnNames }) : null
}

/**
 * Validates a custom aggregate function.
 * @param {object} params - The parameters.
 * @param {object} params.aggregateFunction - The custom aggregate function.
 * @param {object} params.nodeDef - The measure node definition the function belongs to.
 * @param {string[]} params.columnNames - The column names of the entity data view that the expression can use.
 * @returns {Promise<Validation.ValidationInstance>} - The validation.
 */
export const validateAggregateFunction = ({ aggregateFunction, nodeDef, columnNames }) =>
  Validator.validate(aggregateFunction, {
    [AggregateFunction.keys.name]: [
      Validator.validateRequired(Validation.messageKeys.nameRequired),
      // aggregate functions are stored in an object indexed by uuid
      Validator.validateItemPropUniqueness(Validation.messageKeys.nameDuplicate)(
        Object.values(NodeDef.getAggregateFunctions(nodeDef))
      ),
    ],
    [AggregateFunction.keys.expression]: [
      Validator.validateRequired(Validation.messageKeys.aggregateFunction.expressionRequired),
      validateExpression(columnNames),
    ],
  })
