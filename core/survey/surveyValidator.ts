import SurveyInfoValidator from './_surveyValidator/surveyInfoValidator';
import NodeDefValidator from './_surveyValidator/nodeDefValidator';
import NodeDefExpressionsValidator from './_surveyValidator/nodeDefExpressionsValidator';

export default {
  validateNewSurvey: SurveyInfoValidator.validateNewSurvey,

  validateSurveyInfo: SurveyInfoValidator.validateSurveyInfo,

  validateNodeDefs: NodeDefValidator.validateNodeDefs,

  validateNodeDefExpressions: NodeDefExpressionsValidator.validate,
};
