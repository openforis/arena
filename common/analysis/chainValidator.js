import * as StringUtils from '@core/stringUtils'
import * as ObjectUtils from '@core/objectUtils'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as Survey from '@core/survey/survey'

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

const _validateAnalysisNodeDefs =
  ({ survey, chain }) =>
  () =>
    Survey.getAnalysisNodeDefs({ chain })(survey).length === 0
      ? ValidationResult.newInstance(Validation.messageKeys.analysis.analysisNodeDefsRequired)
      : null

export const validateChain = async ({ chain, defaultLang, survey }) =>
  Validator.validate(chain, {
    ..._validationsCommonProps(defaultLang),
    analysisNodeDefs: [_validateAnalysisNodeDefs({ chain, survey })],
  })
