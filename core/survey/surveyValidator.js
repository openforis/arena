import * as SurveyInfoValidator from './_surveyValidator/surveyInfoValidator'
import * as NodeDefValidator from './_surveyValidator/nodeDefValidator'
import * as NodeDefExpressionsValidator from './_surveyValidator/nodeDefExpressionsValidator'

export const { validateNewSurvey, validateSurveyClone, validateSurveyImportFromCollect, validateSurveyInfo } =
  SurveyInfoValidator

export const { validateNodeDef } = NodeDefValidator

export const { validateNodeDefs } = NodeDefValidator

export const validateNodeDefExpressions = NodeDefExpressionsValidator.validate

// ===== CHECK
export const isNodeDefValidationValidOrHasOnlyMissingChildrenErrors =
  NodeDefValidator.isValidationValidOrHasOnlyMissingChildrenErrors
