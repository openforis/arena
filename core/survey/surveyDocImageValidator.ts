import {
  type ArenaSurvey,
  type ArenaSurveyDocImage,
  ArenaValidationResult,
  NodeDefExpressionValidator,
  surveyDocImagePropKeys as propKeys,
  SurveyDocImages,
} from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as SurveyFile from '@core/survey/surveyFile'
import * as Validation from '@core/validation/validation'
import * as Validator from '@core/validation/validator'

const nodeDefExpressionValidator = new NodeDefExpressionValidator()

const validateExpression =
  (survey: ArenaSurvey) =>
  async (_propName: string, surveyDocImage: ArenaSurveyDocImage): Promise<ArenaValidationResult> => {
    if (!survey) return null
    const applyIf = SurveyDocImages.getApplyIf(surveyDocImage)
    if (!applyIf) return null

    const nodeDefCurrent = Survey.getNodeDefRoot(survey) as any
    if (!nodeDefCurrent) return null

    const { validationResult } = await nodeDefExpressionValidator.validate({
      survey: survey as any,
      nodeDefCurrent,
      expression: applyIf,
      selfReferenceAllowed: true,
    })
    return validationResult && !validationResult.valid
      ? (Validation.newInstance(false, {}, [validationResult as ArenaValidationResult]) as any)
      : null
  }

const validate = async ({
  survey = null,
  surveyDocImages,
  surveyDocImage,
}: {
  survey?: ArenaSurvey | null
  surveyDocImages: ArenaSurveyDocImage[]
  surveyDocImage: ArenaSurveyDocImage
}) =>
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
    [`${SurveyFile.keys.props}.${propKeys.applyIf}`]: [validateExpression(survey)],
  })

export const SurveyDocImageValidator = { validate }
