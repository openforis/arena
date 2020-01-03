import * as SurveyInfoValidator from './_surveyValidator/surveyInfoValidator'
import * as NodeDefValidator from './_surveyValidator/nodeDefValidator'
import * as NodeDefExpressionsValidator from './_surveyValidator/nodeDefExpressionsValidator'

export const validateNewSurvey = SurveyInfoValidator.validateNewSurvey

export const validateSurveyInfo = SurveyInfoValidator.validateSurveyInfo

export const validateNodeDef = NodeDefValidator.validateNodeDef

export const validateNodeDefs = NodeDefValidator.validateNodeDefs

export const validateNodeDefExpressions = NodeDefExpressionsValidator.validate

// ===== CHECK
export const isNodeDefValidationValidOrHasOnlyMissingChildrenErrors =
  NodeDefValidator.isValidationValidOrHasOnlyMissingChildrenErrors
