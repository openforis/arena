import * as A from '@core/arena'

import { Objects } from '@openforis/arena-core'

import { ArrayUtils } from '@core/arrayUtils'
import SystemError, { StatusCodes } from '@core/systemError'

import * as Validation from './validation'
import * as ValidationResult from './validationResult'
import * as ValidatorFunctions from './_validator/validatorFunctions'
import type { ValidatorFn, ValidatorResult } from './_validator/validatorFunctions'

const extractNestedErrorsOrWarnings = (
  validationResultOrValidation: ValidatorResult | Validation.ValidationInstance
): { errors: ValidationResult.ValidationResultInstance[]; warnings: ValidationResult.ValidationResultInstance[] } => {
  const errors: ValidationResult.ValidationResultInstance[] = []
  const warnings: ValidationResult.ValidationResultInstance[] = []
  const stack: unknown[] = [validationResultOrValidation]
  const addUniqueItems =
    (items: ValidationResult.ValidationResultInstance[]) => (arr: ValidationResult.ValidationResultInstance[]) =>
      ArrayUtils.addItems({ items, avoidDuplicates: true, compareFn: Objects.isEqual, sideEffect: true })(arr)

  while (stack.length > 0) {
    const currentItem = stack.pop()
    if (currentItem) {
      if (typeof currentItem === 'string') {
        errors.push(currentItem as unknown as ValidationResult.ValidationResultInstance)
      } else if ((currentItem as Record<string, unknown>).key) {
        const item = currentItem as ValidationResult.ValidationResultInstance
        const arr = ValidationResult.isError(item) ? errors : warnings
        const itemToAdd = A.omit([ValidationResult.keys.severity], item)
        addUniqueItems([itemToAdd as ValidationResult.ValidationResultInstance])(arr)
      } else {
        const validation = currentItem as Validation.ValidationInstance
        addUniqueItems(Validation.getErrors(validation))(errors)
        addUniqueItems(Validation.getWarnings(validation))(warnings)
        const fieldValidations = Validation.getFieldValidations(validation)
        stack.push(...Object.values(fieldValidations))
      }
    }
  }
  return { errors, warnings }
}

const validateProp = async (
  obj: unknown,
  prop: string,
  validations: ValidatorFn[] = []
): Promise<Validation.ValidationInstance> => {
  const validationsEvaluated = await Promise.all(validations.map((validationFn) => validationFn(prop, obj)))
  const errors: ValidationResult.ValidationResultInstance[] = []
  const warnings: ValidationResult.ValidationResultInstance[] = []
  validationsEvaluated.forEach((validationResult) => {
    const { errors: errorsCurrent, warnings: warningsCurrent } = extractNestedErrorsOrWarnings(validationResult)
    errors.push(...errorsCurrent)
    warnings.push(...warningsCurrent)
  })
  return Validation.newInstance(A.isEmpty(errors) && A.isEmpty(warnings), {}, errors, warnings)
}

export const validate = async (
  obj: unknown,
  propsValidations: Record<string, ValidatorFn[]>,
  removeValidFields = true
): Promise<Validation.ValidationInstance> => {
  const validation = Validation.newInstance()

  for (const [prop, propValidations] of Object.entries(propsValidations)) {
    const validationProp = await validateProp(obj, prop, propValidations) // NOSONAR
    const validationPropValid = Validation.isValid(validationProp)

    if (!validationPropValid || !removeValidFields) {
      const validationPropKey = A.pipe(A.split('.'), A.last)(prop) as string
      Validation.setField(validationPropKey, validationProp)(validation)
    }

    if (!validationPropValid) {
      Validation.setValid(false)(validation)
    }
  }

  return validation
}

/**
 * Throws a bad request error if one of the names is not valid: names of category levels and extra props are used as
 * export column names and in expressions. Blank names are allowed (reported by the validation of the item).
 * @param names - The names to check.
 */
export const checkNamesAreValid = (names: unknown[]): void => {
  const nameInvalid = names.find((name) => !Objects.isEmpty(name) && !ValidatorFunctions.isNameValid(name))
  if (nameInvalid !== undefined) {
    throw new SystemError(Validation.messageKeys.nameInvalid, { name: nameInvalid }, StatusCodes.BAD_REQUEST)
  }
}

// Validator functions
export const {
  getProp,
  validateRequired,
  validateItemPropUniqueness,
  validateMinLength,
  validateNotKeyword,
  validateName,
  validateNumber,
  validatePositiveOrZeroNumber,
  validateEmail,
  validateEmails,
  isEmailValueValid,
  isKeyword,
} = ValidatorFunctions
