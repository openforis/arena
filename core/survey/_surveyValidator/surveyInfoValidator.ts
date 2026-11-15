import type { Survey as ArenaSurvey } from '@openforis/arena-core'

import * as A from '@core/arena'
import { languageCodes } from '@core/app/languages'
import * as Srs from '@core/geo/srs'
import * as Survey from '@core/survey/survey'
import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

import type { SurveyCycle } from '../surveyCycle'
import * as SurveyCyclesValidator from './surveyCyclesValidator'

const { infoKeys } = Survey

// survey info or new survey params
type SurveyInfoWithId = { id?: number; name?: string; [key: string]: unknown }

const validateSurveyNameUniqueness =
  (surveyInfos: SurveyInfoWithId[] | null = null) =>
  (_propName: string, survey: SurveyInfoWithId) =>
    surveyInfos?.find((s) => s.id !== survey.id) ? { key: Validation.messageKeys.nameDuplicate } : null

export const getSurveyNameValidations = ({
  surveyInfos = null,
  required = true,
}: { surveyInfos?: SurveyInfoWithId[] | null; required?: boolean } = {}) => [
  ...(required ? [Validator.validateRequired(Validation.messageKeys.nameRequired)] : []),
  Validator.validateMinLength({ minLength: 6 }),
  Validator.validateName(Validation.messageKeys.nameInvalid),
  Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
  validateSurveyNameUniqueness(surveyInfos),
]

const validateFieldManualLinks = (_propName: string, survey: ArenaSurvey) => {
  const links = Object.values(Survey.getFieldManualLinks(survey)) as string[]
  return links.every((link) => URL.canParse(link))
    ? null
    : { key: Validation.messageKeys.surveyInfoEdit.fieldManualLinksInvalid }
}

// language codes not supported by Arena (not in the ISO 639-1 list)
export const getInvalidLanguageCodes = (languages: string[]): string[] =>
  languages.filter((lang) => !languageCodes.includes(lang))

// spatial reference system codes are EPSG codes
const srsCodeRegex = /^\d{1,10}$/

// codes of the spatial reference systems that are not EPSG codes (numbers)
export const getInvalidSrsCodes = (srss: ({ code?: string | number } | null | undefined)[]): (string | number)[] =>
  srss.map((srs) => srs?.[Srs.keys.code]).filter((code) => !srsCodeRegex.test(String(code)))

const validateSrsCodes = (propName: string, obj: unknown) => {
  const codesInvalid = getInvalidSrsCodes([Validator.getProp(propName)(obj) ?? []].flat())
  return codesInvalid.length > 0
    ? { key: Validation.messageKeys.surveyInfoEdit.srsInvalid, params: { code: codesInvalid.join(', ') } }
    : null
}

const validateLanguageCodes = (propName: string, obj: unknown) => {
  const value = Validator.getProp(propName)(obj) as string | string[]
  if (A.isEmpty(value)) return null
  const langsInvalid = getInvalidLanguageCodes([value].flat())
  return langsInvalid.length > 0
    ? { key: Validation.messageKeys.surveyInfoEdit.langInvalid, params: { lang: langsInvalid.join(', ') } }
    : null
}

const languageValidations = [
  Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.langRequired),
  validateLanguageCodes,
]

type NewSurveyValidationParams = { newSurvey: SurveyInfoWithId; surveyInfos: SurveyInfoWithId[] }

export const validateNewSurvey = async ({ newSurvey, surveyInfos }: NewSurveyValidationParams) =>
  Validator.validate(newSurvey, {
    name: getSurveyNameValidations({ surveyInfos }),
    lang: languageValidations,
  })

export const validateSurveyClone = async ({ newSurvey, surveyInfos }: NewSurveyValidationParams) =>
  Validator.validate(newSurvey, {
    name: getSurveyNameValidations({ surveyInfos, required: false }),
    cloneFromCycle: [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.cyclesRequired)],
  })

export const validateSurveyImportFromCollect = async ({ newSurvey, surveyInfos }: NewSurveyValidationParams) =>
  Validator.validate(newSurvey, {
    name: getSurveyNameValidations({ surveyInfos, required: false }),
  })

export const validateSurveyInfo = async (
  surveyInfo: ArenaSurvey,
  surveyInfos?: SurveyInfoWithId[]
): Promise<Validation.ValidationInstance> => {
  const validation = await Validator.validate(surveyInfo, {
    [`${infoKeys.props}.${infoKeys.languages}`]: languageValidations,
    [`${infoKeys.props}.${infoKeys.name}`]: getSurveyNameValidations({ surveyInfos }),
    [`${infoKeys.props}.${infoKeys.srs}`]: [
      Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.srsRequired),
      validateSrsCodes,
    ],
    [`${infoKeys.props}.${infoKeys.fieldManualLinks}`]: [validateFieldManualLinks],
  })

  const cyclesValidation = await SurveyCyclesValidator.validateCycles(
    Survey.getCycles(surveyInfo) as Record<string, SurveyCycle>
  )

  return Validation.assocFieldValidation(Survey.infoKeys.cycles, cyclesValidation)(validation)
}
