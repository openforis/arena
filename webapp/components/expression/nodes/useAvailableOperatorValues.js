import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'

import { useNodeDefByName } from '@webapp/store/survey'

const { nodeDefType } = NodeDef

const arithmeticOperatorsAllowedByNodeDefType = {
  [nodeDefType.boolean]: false,
  [nodeDefType.code]: true,
  [nodeDefType.coordinate]: false,
  [nodeDefType.date]: false,
  [nodeDefType.decimal]: true,
  [nodeDefType.integer]: true,
  [nodeDefType.taxon]: false,
  [nodeDefType.text]: true,
}

const isArithmeticOperatorAllowed = ({ leftOperandNodeDefType }) =>
  !leftOperandNodeDefType || arithmeticOperatorsAllowedByNodeDefType[leftOperandNodeDefType]

const allComparisonOperatorsAllowedByNodeDefType = {
  [nodeDefType.boolean]: false,
  [nodeDefType.code]: true,
  [nodeDefType.coordinate]: false,
  [nodeDefType.date]: true,
  [nodeDefType.decimal]: true,
  [nodeDefType.integer]: true,
  [nodeDefType.taxon]: false,
  [nodeDefType.text]: true,
  [nodeDefType.time]: true,
}

const isAllComparisonOperatorsAllowed = ({ leftOperandNodeDefType }) =>
  !leftOperandNodeDefType || allComparisonOperatorsAllowedByNodeDefType[leftOperandNodeDefType]

export const useAvailableOperatorValues = ({ isBoolean, leftOperand, nodeDefCurrent }) => {
  const leftOperandName = Expression.getName(leftOperand)
  const leftOperandNodeDefTemp = useNodeDefByName(leftOperandName)
  const leftOperandNodeDef = leftOperandName === Expression.thisVariable ? nodeDefCurrent : leftOperandNodeDefTemp
  const leftOperandNodeDefType = NodeDef.getType(leftOperandNodeDef)

  const availableOperators = { ...Expression.operators.comparisonEquality }

  if (!isBoolean && isArithmeticOperatorAllowed({ leftOperandNodeDefType })) {
    Object.assign(availableOperators, Expression.operators.arithmetic)
  }
  if (!isBoolean && isAllComparisonOperatorsAllowed({ leftOperandNodeDefType })) {
    Object.assign(availableOperators, Expression.operators.comparison)
  }
  return Object.values(availableOperators)
}
