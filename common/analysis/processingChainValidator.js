import * as R from 'ramda'

import * as StringUtils from '@core/stringUtils'
import * as ObjectUtils from '@core/objectUtils'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

export const keys = {
  entityOrCategory: 'entityOrCategory',
}

const _validateLabelDefaultLanguageRequire = (defaultLang, errorMessageKey) => async (_, item) =>
  StringUtils.isBlank(ObjectUtils.getLabel(defaultLang)(item)) ? ValidationResult.newInstance(errorMessageKey) : null

const _validationsCommonProps = (defaultLang) => ({
  [`${ObjectUtils.keys.props}.${ObjectUtils.keysProps.labels}`]: [
    _validateLabelDefaultLanguageRequire(defaultLang, Validation.messageKeys.analysis.labelDefaultLangRequired),
  ],
})

export const validateChain = async (chain, defaultLang) =>
  Validator.validate(chain, {
    ..._validationsCommonProps(defaultLang),
    [ProcessingChain.keys.processingSteps]: [
      Validator.validateRequired(Validation.messageKeys.analysis.processingChain.stepsRequired),
    ],
  })

export const validateStep = async (step) => {
  const validation = await Validator.validate(step, {
    [ProcessingStep.keys.calculations]: [
      Validator.validateRequired(Validation.messageKeys.analysis.processingStep.calculationsRequired),
    ],
  })

  return R.when(
    R.always(!ProcessingStep.getEntityUuid(step) && !ProcessingStep.getCategoryUuid(step)),
    R.pipe(
      Validation.assocFieldValidation(
        keys.entityOrCategory,
        Validation.newInstance(false, {}, [
          ValidationResult.newInstance(Validation.messageKeys.analysis.processingStep.entityOrCategoryRequired),
        ])
      )
    )
  )(validation)
}

export const validateCalculation = async (calculation, defaultLang) =>
  Validator.validate(calculation, {
    ..._validationsCommonProps(defaultLang),
    [ProcessingStepCalculation.keys.nodeDefUuid]: [
      Validator.validateRequired(Validation.messageKeys.analysis.processingStepCalculation.attributeRequired),
    ],
  })
