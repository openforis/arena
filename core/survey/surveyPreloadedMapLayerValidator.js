import * as SurveyFile from '@core/survey/surveyFile'
import * as Validation from '@core/validation/validation'
import * as Validator from '@core/validation/validator'

const validate = async ({ preloadedMapLayers, preloadedMapLayer }) =>
  Validator.validate(preloadedMapLayer, {
    [`${SurveyFile.keys.props}.${SurveyFile.propKeys.name}`]: [
      Validator.validateRequired(Validation.messageKeys.surveyPreloadedMapLayer.fileRequired),
      Validator.validateItemPropUniqueness(Validation.messageKeys.surveyPreloadedMapLayer.fileNameDuplicate)(
        preloadedMapLayers
      ),
    ],
    [`${SurveyFile.keys.props}.${SurveyFile.propKeys.labels}`]: [
      Validator.validateRequired(Validation.messageKeys.surveyPreloadedMapLayer.labelsRequired),
    ],
  })

export const SurveyPreloadedMapLayerValidator = {
  validate,
}
