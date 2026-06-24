import { NodeDefExpressionValidator } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as SurveyFile from '@core/survey/surveyFile'
import * as Validation from '@core/validation/validation'
import * as Validator from '@core/validation/validator'
import type { ValidatorResult } from '@core/validation/_validator/validatorFunctions'

import { propKeys, getExpression, type SurveyDocImage } from './surveyDocImage'

const nodeDefExpressionValidator = new NodeDefExpressionValidator()

const validateExpression =
  (survey: unknown) =>
  async (_propName: string, surveyDocImage: unknown): Promise<ValidatorResult> => {
    if (!survey) return null
    const expression = getExpression(surveyDocImage as SurveyDocImage)
    if (!expression) return null

    const nodeDefCurrent = Survey.getNodeDefRoot(survey as object) as any
    if (!nodeDefCurrent) return null

    const { validationResult } = await nodeDefExpressionValidator.validate({
      survey: survey as any,
      nodeDefCurrent,
      expression,
      selfReferenceAllowed: true,
    })
    return validationResult && !validationResult.valid
      ? (Validation.newInstance(false, {}, [validationResult as any]) as any)
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
      Validator.validateItemPropUniqueness(Validation.messageKeys.surveyDocImage.fileNameDuplicate)(
        surveyDocImages as Record<string, unknown>[]
      ),
    ],
    [`${SurveyFile.keys.props}.${SurveyFile.propKeys.labels}`]: [
      Validator.validateRequired(Validation.messageKeys.surveyDocImage.labelsRequired),
    ],
    [`${SurveyFile.keys.props}.${propKeys.documentPlace}`]: [
      Validator.validateRequired(Validation.messageKeys.surveyDocImage.documentPlaceRequired),
    ],
    [`${SurveyFile.keys.props}.${propKeys.expression}`]: [validateExpression(survey)],
  })

export const SurveyDocImageValidator = { validate }
