import * as Validation from '@core/validation/validation'
import * as Survey from '@core/survey/survey'
import * as Expression from '@core/expressionParser/expression'
import SystemError from '@core/systemError'

import * as NodeNativeProperties from '@core/survey/nodeDefExpressionNativeProperties'

const _memberPropertyEval = ({ survey, nodeDefContext, property }) => {
  const propertyName = Expression.getName(property)

  if (NodeNativeProperties.isNativePropertyAllowed({ nodeDef: nodeDefContext, propertyName })) {
    // simulate node property getter
    return {}
  }

  const childDef = Survey.getNodeDefChildByName(nodeDefContext, propertyName)(survey)
  if (!childDef) {
    throw new SystemError(Validation.messageKeys.expressions.unableToFindNode, { name: propertyName })
  }
  return childDef
}

export const memberEval = ({ survey }) => (expr, ctx) => {
  const { object, property } = expr

  const objectEval = Expression.evalExpr({ expr: object, ctx })
  if (objectEval === null) {
    return null
  }
  if (Expression.isIdentifier(property)) {
    return _memberPropertyEval({ survey, nodeDefContext: objectEval, property })
  }
  if (Expression.isLiteral(property)) {
    // simulate access to element at index, but return only the node def
    return objectEval
  }
  return Expression.evalExpr({ expr: property, ctx: { ...ctx, node: objectEval } })
}
