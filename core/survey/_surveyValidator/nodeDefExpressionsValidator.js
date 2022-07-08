import * as R from 'ramda'

import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as ObjectUtils from '@core/objectUtils'
import * as NodeDefExpressionValidator from '../nodeDefExpressionValidator'
import * as SurveyDependencyTypes from '../_survey/surveyDependencyTypes'

const expressionsByDependencyTypeFns = {
  [SurveyDependencyTypes.dependencyTypes.defaultValues]: NodeDef.getDefaultValues,
  [SurveyDependencyTypes.dependencyTypes.applicable]: NodeDef.getApplicable,
  [SurveyDependencyTypes.dependencyTypes.validations]: R.pipe(
    NodeDef.getValidations,
    NodeDefValidations.getExpressions
  ),
  [SurveyDependencyTypes.dependencyTypes.formula]: NodeDef.getFormula,
}

const applyIfUniquenessByDependencyType = {
  [SurveyDependencyTypes.dependencyTypes.defaultValues]: true,
  [SurveyDependencyTypes.dependencyTypes.applicable]: false,
  [SurveyDependencyTypes.dependencyTypes.validations]: false,
  [SurveyDependencyTypes.dependencyTypes.formula]: false,
}

const errorKeyByDependencyType = {
  [SurveyDependencyTypes.dependencyTypes.defaultValues]: Validation.messageKeys.nodeDefEdit.defaultValuesInvalid,
  [SurveyDependencyTypes.dependencyTypes.applicable]: Validation.messageKeys.nodeDefEdit.applyIfInvalid,
  [SurveyDependencyTypes.dependencyTypes.validations]: Validation.messageKeys.nodeDefEdit.validationsInvalid,
  [SurveyDependencyTypes.dependencyTypes.formula]: Validation.messageKeys.nodeDefEdit.formulaInvalid,
}

const _validateExpressionProp = (survey, nodeDef, dependencyType) => async (propName, item) => {
  const exprString = R.pathOr(null, propName.split('.'), item)
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

const _validateOnlyLastApplyIfEmpty = (nodeDefExpressions, i) => async (propName, nodeDefExpression) => {
  const expr = NodeDefExpression.getApplyIf(nodeDefExpression)
  return R.isEmpty(expr) && i < nodeDefExpressions.length - 1
    ? {
        key: Validation.messageKeys.nodeDefEdit.expressionApplyIfOnlyLastOneCanBeEmpty,
      }
    : null
}

const _validateExpressionUniqueness = (nodeDefExpressions, nodeDefExpression) =>
  R.any(
    (nodeDefExpr) =>
      !ObjectUtils.isEqual(nodeDefExpression)(nodeDefExpr) &&
      NodeDefExpression.getExpression(nodeDefExpr) === NodeDefExpression.getExpression(nodeDefExpression) &&
      NodeDefExpression.getApplyIf(nodeDefExpr) === NodeDefExpression.getApplyIf(nodeDefExpression)
  )(nodeDefExpressions)
    ? Validation.newInstance(false, {}, [{ key: Validation.messageKeys.nodeDefEdit.expressionDuplicate }])
    : null

const _validateExpression = async ({
  survey,
  nodeDef,
  dependencyType,
  nodeDefExpressions,
  nodeDefExpression,
  index,
}) => {
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

export const validate = async (survey, nodeDef, dependencyType) => {
  const result = Validation.newInstance()

  const nodeDefExpressions = expressionsByDependencyTypeFns[dependencyType](nodeDef)
  const errorKey = errorKeyByDependencyType[dependencyType]

  const validations = await Promise.all(
    nodeDefExpressions.map((nodeDefExpression, index) =>
      _validateExpression({ survey, nodeDef, dependencyType, nodeDefExpressions, nodeDefExpression, index })
    )
  )

  validations.forEach((validation, index) => {
    Validation.setField(String(index), validation)(result)
    if (!Validation.isValid(validation)) {
      Validation.setValid(false)(result)
    }
  })

  if (!Validation.isValid(result)) {
    Validation.setErrors([{ key: errorKey }])(result)
  }

  return result
}
