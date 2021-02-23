import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'

import SystemError from '@core/systemError'

import { identifierEval } from './identifierEval'
import { memberEval } from './memberEval'

export const findReferencedNodeDefs = ({
  survey,
  nodeDef,
  exprString,
  isContextParent = true,
  selfReferenceAllowed = true,
}) => {
  if (!exprString) {
    return []
  }
  const referencedNodeDefs = {}
  const addReferencedNodeDef = (nodeDefRef) => {
    if (nodeDefRef && !R.isEmpty(nodeDefRef)) {
      referencedNodeDefs[NodeDef.getUuid(nodeDefRef)] = nodeDefRef
    }
    return nodeDefRef
  }
  const evaluators = {
    [Expression.types.Identifier]: (expr, ctx) =>
      addReferencedNodeDef(
        identifierEval({ survey, nodeDefCurrent: nodeDef, selfReferenceAllowed, evaluateToNode: true })(expr, ctx)
      ),
    [Expression.types.MemberExpression]: (expr, ctx) => addReferencedNodeDef(memberEval(expr, ctx)),
  }
  const functions = {
    [Expression.functionNames.parent]: (nodeDefArg) => {
      if (NodeDef.isRoot(nodeDefArg)) {
        return null
      }
      const parentDef = Survey.getNodeDefParent(nodeDefArg)(survey)
      return addReferencedNodeDef(parentDef)
    },
  }
  const nodeDefContext = isContextParent ? Survey.getNodeDefParent(nodeDef)(survey) : nodeDef
  Expression.evalString(exprString, { evaluators, functions, node: nodeDefContext })
  return referencedNodeDefs
}

export const validate = ({
  survey,
  nodeDefCurrent,
  exprString,
  isContextParent = false,
  selfReferenceAllowed = false,
}) => {
  try {
    findReferencedNodeDefs({ survey, nodeDef: nodeDefCurrent, exprString, isContextParent, selfReferenceAllowed })
    return null
  } catch (error) {
    const details = R.is(SystemError, error) ? `$t(${error.key})` : error.toString()
    return ValidationResult.newInstance(Validation.messageKeys.expressions.expressionInvalid, {
      details,
      ...error.params,
    })
  }
}
