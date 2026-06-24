import { NodeDefExpressionValidator, ValidationResult } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as SurveyFile from '@core/survey/surveyFile'
import * as Validation from '@core/validation/validation'
import * as Validator from '@core/validation/validator'

import { propKeys, getApplyIf, type SurveyDocImage } from './surveyDocImage'
import { ValidationResultInstance } from '@core/validation/validationResult'

const nodeDefExpressionValidator = new NodeDefExpressionValidator()

const validateExpression =
  (survey: unknown) =>
  async (_propName: string, surveyDocImage: SurveyDocImage): Promise<ValidationResult> => {
    if (!survey) return null
    const applyIf = getApplyIf(surveyDocImage)
    if (!applyIf) return null

    const nodeDefCurrent = Survey.getNodeDefRoot(survey as object) as any
    if (!nodeDefCurrent) return null

    const { validationResult } = await nodeDefExpressionValidator.validate({
      survey: survey as any,
      nodeDefCurrent,
      expression: applyIf,
      selfReferenceAllowed: true,
    })
    return validationResult && !validationResult.valid
      ? (Validation.newInstance(false, {}, [validationResult as ValidationResultInstance]) as any)
      : null
  }

const validate = async ({
  survey = null,
  surveyDocImages,
  surveyDocImage,
}: {
  survey?: unknown
  surveyDocImages: SurveyDocImage[]
  surveyDocImage: SurveyDocImage
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
