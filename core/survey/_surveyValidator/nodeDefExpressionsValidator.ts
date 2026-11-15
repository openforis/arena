import type {
  NodeDef as ArenaNodeDef,
  NodeDefExpression as ArenaNodeDefExpression,
  NodeDefType,
  Survey as ArenaSurvey,
} from '@openforis/arena-core'

import * as A from '@core/arena'

import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as ObjectUtils from '@core/objectUtils'
import * as NodeDefExpressionValidator from '../nodeDefExpressionValidator'
import * as SurveyDependencyTypes from '../_survey/surveyDependencyTypes'

const { dependencyTypes } = SurveyDependencyTypes

type AnyNodeDef = ArenaNodeDef<NodeDefType>

const expressionsByDependencyTypeFns: Record<string, (nodeDef: AnyNodeDef) => ArenaNodeDefExpression[]> = {
  [dependencyTypes.defaultValues]: NodeDef.getDefaultValues,
  [dependencyTypes.applicable]: NodeDef.getApplicable,
  [dependencyTypes.validations]: A.pipe(NodeDef.getValidations, NodeDefValidations.getExpressions),
  [dependencyTypes.formula]: NodeDef.getFormula,
  // count expressions are validated here only when they are arrays of expressions
  [dependencyTypes.maxCount]: (nodeDef) =>
    NodeDefValidations.getMaxCount(NodeDef.getValidations(nodeDef)) as ArenaNodeDefExpression[],
  [dependencyTypes.minCount]: (nodeDef) =>
    NodeDefValidations.getMinCount(NodeDef.getValidations(nodeDef)) as ArenaNodeDefExpression[],
  [dependencyTypes.required]: A.pipe(NodeDef.getValidations, NodeDefValidations.getRequiredIf),
}

const applyIfUniquenessByDependencyType: Record<string, boolean> = {
  [dependencyTypes.defaultValues]: true,
  [dependencyTypes.applicable]: false,
  [dependencyTypes.validations]: false,
  [dependencyTypes.formula]: false,
  [dependencyTypes.maxCount]: true,
  [dependencyTypes.minCount]: true,
  [dependencyTypes.required]: false,
}

const errorKeyByDependencyType: Record<string, string> = {
  [dependencyTypes.defaultValues]: Validation.messageKeys.nodeDefEdit.defaultValuesInvalid,
  [dependencyTypes.applicable]: Validation.messageKeys.nodeDefEdit.applyIfInvalid,
  [dependencyTypes.validations]: Validation.messageKeys.nodeDefEdit.validationsInvalid,
  [dependencyTypes.formula]: Validation.messageKeys.nodeDefEdit.formulaInvalid,
  [dependencyTypes.maxCount]: Validation.messageKeys.nodeDefEdit.countMaxInvalid,
  [dependencyTypes.minCount]: Validation.messageKeys.nodeDefEdit.countMinInvalid,
  [dependencyTypes.required]: Validation.messageKeys.nodeDefEdit.requiredIfInvalid,
}

const _validateExpressionProp =
  (survey: ArenaSurvey, nodeDef: AnyNodeDef, dependencyType: string) => async (propName: string, item: unknown) => {
    const exprString: string | null = A.pathOr(null, propName.split('.'), item)
    const isContextParent = SurveyDependencyTypes.isContextParentByDependencyType[dependencyType]
    const selfReferenceAllowed = SurveyDependencyTypes.selfReferenceAllowedByDependencyType[dependencyType]

    return exprString
      ? NodeDefExpressionValidator.validate({
          survey,
          nodeDefCurrent: nodeDef,
          exprString,
          isContextParent,
          selfReferenceAllowed,
        })
      : null
  }

const _validateOnlyLastApplyIfEmpty =
  (nodeDefExpressions: ArenaNodeDefExpression[], i: number) =>
  async (_propName: string, nodeDefExpression: ArenaNodeDefExpression) => {
    const expr = NodeDefExpression.getApplyIf(nodeDefExpression)
    return A.isEmpty(expr) && i < nodeDefExpressions.length - 1
      ? {
          key: Validation.messageKeys.nodeDefEdit.expressionApplyIfOnlyLastOneCanBeEmpty,
        }
      : null
  }

const _validateExpressionUniqueness = (
  nodeDefExpressions: ArenaNodeDefExpression[],
  nodeDefExpression: ArenaNodeDefExpression
): Validation.ValidationInstance | null =>
  A.any(
    (nodeDefExpr) =>
      !ObjectUtils.isEqual(nodeDefExpression)(nodeDefExpr) &&
      NodeDefExpression.getExpression(nodeDefExpr) === NodeDefExpression.getExpression(nodeDefExpression) &&
      NodeDefExpression.getApplyIf(nodeDefExpr) === NodeDefExpression.getApplyIf(nodeDefExpression)
  )(nodeDefExpressions)
    ? Validation.newInstance(false, {}, [
        ValidationResult.newInstance(Validation.messageKeys.nodeDefEdit.expressionDuplicate),
      ])
    : null

const _validateExpression = async ({
  survey,
  nodeDef,
  dependencyType,
  nodeDefExpressions,
  nodeDefExpression,
  index,
}: {
  survey: ArenaSurvey
  nodeDef: AnyNodeDef
  dependencyType: string
  nodeDefExpressions: ArenaNodeDefExpression[]
  nodeDefExpression: ArenaNodeDefExpression
  index: number
}): Promise<Validation.ValidationInstance | null> => {
  const validateApplyIfUniqueness = applyIfUniquenessByDependencyType[dependencyType]

  const validation = await Validator.validate(nodeDefExpression, {
    [NodeDefExpression.keys.expression]: [
      Validator.validateRequired(Validation.messageKeys.nodeDefEdit.expressionRequired),
      _validateExpressionProp(survey, nodeDef, dependencyType),
    ],
    [NodeDefExpression.keys.applyIf]: [
      _validateExpressionProp(survey, nodeDef, dependencyType),
      ...(validateApplyIfUniqueness
        ? [
            Validator.validateItemPropUniqueness(Validation.messageKeys.nodeDefEdit.applyIfDuplicate)(
              nodeDefExpressions
            ),
            _validateOnlyLastApplyIfEmpty(nodeDefExpressions, index),
          ]
        : []),
    ],
  })

  return Validation.isValid(validation)
    ? _validateExpressionUniqueness(nodeDefExpressions, nodeDefExpression)
    : validation
}

export const validate = async (
  survey: ArenaSurvey,
  nodeDef: AnyNodeDef,
  dependencyType: string
): Promise<Validation.ValidationInstance | null> => {
  const result = Validation.newInstance()

  const nodeDefExpressions = expressionsByDependencyTypeFns[dependencyType](nodeDef)
  const errorKey = errorKeyByDependencyType[dependencyType]

  const validations = await Promise.all(
    nodeDefExpressions.map((nodeDefExpression, index) =>
      _validateExpression({ survey, nodeDef, dependencyType, nodeDefExpressions, nodeDefExpression, index })
    )
  )

  for (const [index, validation] of validations.entries()) {
    if (validation) {
      Validation.setField(String(index), validation)(result)
      if (!Validation.isValid(validation)) {
        Validation.setValid(false)(result)
      }
    }
  }

  if (!Validation.isValid(result)) {
    Validation.setErrors([ValidationResult.newInstance(errorKey)])(result)
    return result
  }
  return null
}
