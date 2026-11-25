import * as NodeDefExpressionsValidator from './_surveyValidator/nodeDefExpressionsValidator'
import * as NodeDefValidator from './_surveyValidator/nodeDefValidator'
import * as SurveyCyclesValidator from './_surveyValidator/surveyCyclesValidator'
import * as SurveyInfoValidator from './_surveyValidator/surveyInfoValidator'

export const {
  getInvalidLanguageCodes,
  getInvalidSrsCodes,
  getSurveyNameValidations,
  validateNewSurvey,
  validateSurveyClone,
  validateSurveyImportFromCollect,
  validateSurveyInfo,
} = SurveyInfoValidator

export const { areCycleKeysValid } = SurveyCyclesValidator

export const { validateNodeDef } = NodeDefValidator

export const { validateNodeDefs } = NodeDefValidator

export const validateNodeDefExpressions = NodeDefExpressionsValidator.validate

// ===== CHECK
export const isNodeDefValidationValidOrHasOnlyMissingChildrenErrors =
  NodeDefValidator.isValidationValidOrHasOnlyMissingChildrenErrors
