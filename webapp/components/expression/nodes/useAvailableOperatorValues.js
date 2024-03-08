import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'

import { useNodeDefByName } from '@webapp/store/survey'

const { nodeDefType } = NodeDef

const arithmeticOperatorsAllowedByNodeDefType = {
  [nodeDefType.boolean]: false,
  [nodeDefType.code]: true,
  [nodeDefType.coordinate]: false,
  [nodeDefType.date]: true,
  [nodeDefType.decimal]: true,
  [nodeDefType.integer]: true,
  [nodeDefType.taxon]: false,
  [nodeDefType.text]: true,
}

const isArithmeticOperatorAllowed = ({ leftOperandNodeDefType }) =>
  !leftOperandNodeDefType || arithmeticOperatorsAllowedByNodeDefType[leftOperandNodeDefType]

export const useAvailableOperatorValues = ({ isBoolean, leftOperand, nodeDefCurrent }) => {
  const leftOperandName = Expression.getName(leftOperand)
  const leftOperandNodeDefTemp = useNodeDefByName(leftOperandName)
  const leftOperandNodeDef = leftOperandName === Expression.thisVariable ? nodeDefCurrent : leftOperandNodeDefTemp
  const leftOperandNodeDefType = NodeDef.getType(leftOperandNodeDef)

  const availableOperatorValues = Object.values(Expression.operators.comparison)

  if (!isBoolean && isArithmeticOperatorAllowed({ leftOperandNodeDefType })) {
    availableOperatorValues.push(...Object.values(Expression.operators.arithmetic))
  }
  return availableOperatorValues
}
