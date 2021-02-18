import * as R from 'ramda'

import * as Expression from '@core/expressionParser/expression'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'

import SystemError from '@core/systemError'

import { identifierEval } from './identifierEval'
import { memberEval } from './memberEval'

export const validate = ({
  survey,
  nodeDefCurrent,
  exprString,
  isContextParent = false,
  selfReferenceAllowed = false,
}) => {
  const functions = {
    [Expression.types.Identifier]: identifierEval({ survey, nodeDefCurrent, selfReferenceAllowed }),
    [Expression.types.MemberExpression]: memberEval({ survey }),
  }
  try {
    const nodeDefContext = isContextParent ? Survey.getNodeDefParent(nodeDefCurrent)(survey) : nodeDefCurrent
    Expression.evalString(exprString, { functions, node: nodeDefContext })
    return null
  } catch (error) {
    const details = R.is(SystemError, error) ? `$t(${error.key})` : error.toString()
    return ValidationResult.newInstance(Validation.messageKeys.expressions.expressionInvalid, {
      details,
      ...error.params,
    })
  }
}
