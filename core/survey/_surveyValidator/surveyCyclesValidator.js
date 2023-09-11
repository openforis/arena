import * as R from 'ramda'

import { Dates } from '@openforis/arena-core'

import * as SurveyCycle from '../surveyCycle'
import * as Validator from '../../validation/validator'
import * as Validation from '../../validation/validation'
import * as ValidationResult from '../../validation/validationResult'

import * as DateUtils from '../../dateUtils'

const MAX_CYCLES = 10

const _validateDate = (errorMessageKey) => (propName, obj) => {
  const value = obj[propName]
  return value && !DateUtils.isValidDateInFormat(value, SurveyCycle.dateFormat)
    ? ValidationResult.newInstance(errorMessageKey)
    : null
}

const _validateDateIsBefore = (dateStr, dateToCompareStr, errorMessageKey) => {
  if (!dateStr || !dateToCompareStr) {
    return null
  }

  const date = DateUtils.parse(dateStr, SurveyCycle.dateFormat)
  const dateToCompare = DateUtils.parse(dateToCompareStr, SurveyCycle.dateFormat)

  return Dates.isBefore(date, dateToCompare) ? null : ValidationResult.newInstance(errorMessageKey)
}

const _validateCycleStartDateBeforeEndDate = (propName, item) =>
  _validateDateIsBefore(
    SurveyCycle.getDateStart(item),
    SurveyCycle.getDateEnd(item),
    Validation.messageKeys.surveyInfoEdit.cycleDateStartBeforeDateEnd
  )

const _validateDateStartAfterPrevDateEnd = (cyclePrev) => (propName, item) =>
  _validateDateIsBefore(
    SurveyCycle.getDateEnd(cyclePrev),
    SurveyCycle.getDateStart(item),
    Validation.messageKeys.surveyInfoEdit.cycleDateStartAfterPrevDateEnd
  )

const _cycleValidators = (cyclePrev, isLast) => ({
  [SurveyCycle.keys.dateStart]: [
    Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.cycleDateStartMandatory),
    _validateDate(Validation.messageKeys.surveyInfoEdit.cycleDateStartInvalid),
    _validateCycleStartDateBeforeEndDate,
    ...(cyclePrev ? [_validateDateStartAfterPrevDateEnd(cyclePrev)] : []),
  ],
  [SurveyCycle.keys.dateEnd]: [
    // Date end is required for all but the last cycle
    ...(isLast
      ? []
      : [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.cycleDateEndMandatoryExceptForLastCycle)]),
    _validateDate(Validation.messageKeys.surveyInfoEdit.cycleDateEndInvalid),
  ],
})

export const validateCycles = async (cycles) => {
  const cyclesArray = R.values(cycles)
  const cyclesSize = cyclesArray.length

  const result = Validation.newInstance()

  // 1. validate cycles size
  if (cyclesSize === 0 || cyclesSize > MAX_CYCLES) {
    const errorKey =
      cyclesSize === 0
        ? Validation.messageKeys.surveyInfoEdit.cyclesRequired
        : Validation.messageKeys.surveyInfoEdit.cyclesExceedingMax
    Validation.setErrors([ValidationResult.newInstance(errorKey)])
    Validation.setValid(false)
  }

  // 2. validate each cycle
  let cyclePrev = null
  for (let index = 0; index < cyclesSize; index++) {
    const cycle = cyclesArray[index]

    const isLast = index === cyclesSize - 1
    const cycleValidation = await Validator.validate(cycle, _cycleValidators(cyclePrev, isLast))

    if (!Validation.isValid(cycleValidation)) {
      Validation.setField(String(index), cycleValidation)(result)
      Validation.setValid(false)(result)
    }

    cyclePrev = cycle
  }

  return result
}
