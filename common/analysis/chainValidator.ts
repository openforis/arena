import type { ArenaChain, ArenaSurvey, ArenaValidation } from '@openforis/arena-core'

import * as StringUtils from '@core/stringUtils'
import * as ObjectUtils from '@core/objectUtils'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import * as ValidationResult from '@core/validation/validationResult'
import * as Survey from '@core/survey/survey'

export const keys = {
  entityOrCategory: 'entityOrCategory',
}

const _validateLabelDefaultLanguageRequire =
  (defaultLang: string, errorMessageKey: string) => (_: string, item: object) =>
    StringUtils.isBlank(ObjectUtils.getLabel(defaultLang)(item)) ? ValidationResult.newInstance(errorMessageKey) : null

const _validationsCommonProps = (defaultLang: string) => ({
  [`${ObjectUtils.keys.props}.${ObjectUtils.keysProps.labels}`]: [
    _validateLabelDefaultLanguageRequire(defaultLang, Validation.messageKeys.analysis.labelDefaultLangRequired),
  ],
})

const _validateAnalysisNodeDefs =
  ({ survey, chain }: { survey: ArenaSurvey; chain: ArenaChain }) =>
  () =>
    Survey.getAnalysisNodeDefs({ chain })(survey).length === 0
      ? ValidationResult.newInstance(Validation.messageKeys.analysis.analysisNodeDefsRequired)
      : null

export const validateChain = async ({
  chain,
  defaultLang,
  survey,
}: {
  chain: ArenaChain
  defaultLang: string
  survey: ArenaSurvey
}): Promise<ArenaValidation> =>
  Validator.validate(chain, {
    ..._validationsCommonProps(defaultLang),
    analysisNodeDefs: [_validateAnalysisNodeDefs({ chain, survey })],
  })
