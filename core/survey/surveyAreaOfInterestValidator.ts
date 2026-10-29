import type { AreaOfInterestDescriptor } from '@openforis/arena-core'

import * as Validation from '@core/validation/validation'
import * as Validator from '@core/validation/validator'

import { keys } from './surveyAreaOfInterest'

/**
 * Validates an area of interest: its name is used in expressions, so it must be a unique identifier.
 *
 * @param {object} params - The parameters.
 * @param {AreaOfInterestDescriptor[]} params.areasOfInterest - The other areas of interest of the survey.
 * @param {object} params.areaOfInterest - The area of interest to validate.
 * @returns {Promise<object>} - The validation.
 */
const validate = async ({
  areasOfInterest,
  areaOfInterest,
}: {
  areasOfInterest: AreaOfInterestDescriptor[]
  areaOfInterest: Partial<AreaOfInterestDescriptor>
}) =>
  Validator.validate(areaOfInterest, {
    [keys.name]: [
      Validator.validateRequired(Validation.messageKeys.surveyAreaOfInterest.nameRequired),
      Validator.validateName(Validation.messageKeys.nameInvalid),
      Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
      // not validateItemPropUniqueness: it skips items by uuid, and descriptors have none
      (_propName: string, item: Partial<AreaOfInterestDescriptor>) =>
        areasOfInterest.some((other) => other.name === item.name)
          ? { key: Validation.messageKeys.surveyAreaOfInterest.nameDuplicate }
          : null,
    ],
    [keys.fileUuid]: [Validator.validateRequired(Validation.messageKeys.surveyAreaOfInterest.fileRequired)],
  })

export const SurveyAreaOfInterestValidator = { validate }
