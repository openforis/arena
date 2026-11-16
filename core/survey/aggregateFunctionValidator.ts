import type { NodeDef as ArenaNodeDef, NodeDefType, Validation as ArenaValidation } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'
import { AggregateFunction, AggregateFunctionItem } from '@core/survey/aggregateFunction'
import { AggregateFunctionExpression } from '@core/survey/aggregateFunctionExpression'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

// validator of the SQL expression, allowing only the specified columns
const validateExpression = (columnNames: string[]) => (propName: string, aggregateFunction: AggregateFunctionItem) => {
  const expression = Validator.getProp(propName)(aggregateFunction) as string
  return expression ? AggregateFunctionExpression.validate({ expression, columnNames }) : null
}

// validates a custom aggregate function of a measure node def; the expression can use only the specified columns
export const validateAggregateFunction = ({
  aggregateFunction,
  nodeDef,
  columnNames,
}: {
  aggregateFunction: AggregateFunctionItem
  nodeDef: ArenaNodeDef<NodeDefType>
  columnNames: string[]
}): Promise<ArenaValidation> =>
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
