import * as SurveyFile from '@core/survey/surveyFile'
import * as Validation from '@core/validation/validation'
import * as Validator from '@core/validation/validator'

import { propKeys } from './surveyDocImage'

const validate = async ({ surveyDocImages, surveyDocImage }: { surveyDocImages: object[]; surveyDocImage: object }) =>
  Validator.validate(surveyDocImage, {
    [`${SurveyFile.keys.props}.${SurveyFile.propKeys.name}`]: [
      Validator.validateRequired(Validation.messageKeys.surveyDocImage.fileRequired),
      Validator.validateItemPropUniqueness(Validation.messageKeys.surveyDocImage.fileNameDuplicate)(surveyDocImages),
    ],
    [`${SurveyFile.keys.props}.${SurveyFile.propKeys.labels}`]: [
      Validator.validateRequired(Validation.messageKeys.surveyDocImage.labelsRequired),
    ],
    [`${SurveyFile.keys.props}.${propKeys.documentPlace}`]: [
      Validator.validateRequired(Validation.messageKeys.surveyDocImage.documentPlaceRequired),
    ],
  })

export const SurveyDocImageValidator = { validate }
