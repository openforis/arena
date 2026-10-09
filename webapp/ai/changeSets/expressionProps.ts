/**
 * Expression properties of a node definition: read, write and check them as the node definition editor does.
 */
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as NodeDefExpressionValidator from '@core/survey/nodeDefExpressionValidator'
import * as ValidationResult from '@core/validation/validationResult'

import type { NodeDefExpressionProp } from './types'

type Translate = (key: string, params?: Record<string, unknown>) => string

export const expressionPropContexts: Record<
  NodeDefExpressionProp,
  { isContextParent: boolean; selfReferenceAllowed: boolean }
> = {
  defaultValues: { isContextParent: false, selfReferenceAllowed: false },
  applicable: { isContextParent: true, selfReferenceAllowed: false },
  'validations.expressions': { isContextParent: false, selfReferenceAllowed: true },
  visibleIf: { isContextParent: true, selfReferenceAllowed: false },
  editableIf: { isContextParent: true, selfReferenceAllowed: false },
}

// the designer edits these with a single expression box (deviation 7)
export const singleExpressionProps: readonly NodeDefExpressionProp[] = ['applicable', 'visibleIf', 'editableIf']

/**
 * Returns the expressions of an expression property.
 * @param {object} nodeDef - Node definition.
 * @param {NodeDefExpressionProp} prop - Property.
 * @returns {object[]} The expressions (empty when none).
 */
export const getExpressionProp = (nodeDef: any, prop: NodeDefExpressionProp): any[] =>
  prop === 'validations.expressions'
    ? NodeDefValidations.getExpressions(NodeDef.getValidations(nodeDef))
    : NodeDef.getPropAdvanced(prop, [])(nodeDef)

/**
 * Returns the node definition with the expressions of a property replaced.
 * @param {object} nodeDef - Node definition.
 * @param {NodeDefExpressionProp} prop - Property.
 * @param {object[]} expressions - New expressions.
 * @returns {object} The updated node definition.
 */
export const setExpressionProp = (nodeDef: any, prop: NodeDefExpressionProp, expressions: any[]): any =>
  prop === 'validations.expressions'
    ? NodeDef.assocValidations(NodeDefValidations.assocExpressions(expressions)(NodeDef.getValidations(nodeDef)))(
        nodeDef
      )
    : NodeDef.mergePropsAdvanced({ [prop]: expressions })(nodeDef)

/**
 * Checks one expression string in the context of a node definition.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey (with the node definition).
 * @param {object} params.nodeDef - Node definition the expression belongs to.
 * @param {NodeDefExpressionProp} params.prop - Property (sets the context).
 * @param {string} params.exprString - Expression.
 * @param {Translate} params.t - Translator.
 * @returns {Promise<string|null>} The translated error, or null when valid.
 */
export const checkExpressionString = async ({
  survey,
  nodeDef,
  prop,
  exprString,
  t,
}: {
  survey: any
  nodeDef: any
  prop: NodeDefExpressionProp
  exprString: string
  t: Translate
}): Promise<string | null> => {
  try {
    const result = await NodeDefExpressionValidator.validate({
      survey,
      nodeDefCurrent: nodeDef,
      exprString,
      ...expressionPropContexts[prop],
    })
    return result
      ? t(`validationErrors:${ValidationResult.getKey(result)}`, ValidationResult.getParams(result) ?? {})
      : null
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

/**
 * Checks an expression and its applyIf.
 * @param {object} params - Parameters.
 * @param {object} params.survey - Survey.
 * @param {object} params.nodeDef - Node definition.
 * @param {NodeDefExpressionProp} params.prop - Property.
 * @param {object} params.expression - Node definition expression.
 * @param {Translate} params.t - Translator.
 * @returns {Promise<string[]>} The messages (empty when valid); applyIf messages start with "applyIf: ".
 */
export const checkNodeDefExpression = async ({
  survey,
  nodeDef,
  prop,
  expression,
  t,
}: {
  survey: any
  nodeDef: any
  prop: NodeDefExpressionProp
  expression: any
  t: Translate
}): Promise<string[]> => {
  const messages: string[] = []
  const params = { survey, nodeDef, prop, t }
  const exprString = NodeDefExpression.getExpression(expression)
  const expressionError = exprString.trim() ? await checkExpressionString({ ...params, exprString }) : null
  if (expressionError) messages.push(expressionError)
  const applyIf = NodeDefExpression.getApplyIf(expression)
  const applyIfError = applyIf ? await checkExpressionString({ ...params, exprString: applyIf }) : null
  if (applyIfError) messages.push(`applyIf: ${applyIfError}`)
  return messages
}
