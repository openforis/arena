const R = require('ramda')

const Validator = require('../../validation/validator')
const Validation = require('../../validation/validation')

const MAX_CYCLES = 10

const validateSurveyNameUniqueness = surveyInfos => (propName, survey) => {
  return !R.isEmpty(surveyInfos) && R.find(s => s.id !== survey.id, surveyInfos)
    ? { key: Validation.messageKeys.nameDuplicate }
    : null
}

const toErrorKey = key => key === null ? null : { key }
const cycleProps = (propName, nodeDef) => R.path(propName.split('.'), nodeDef)

const isValidDate = dateStr => !dateStr || !isNaN(Date.parse(dateStr))

const validateCycleMinLength = x =>
  Object.keys(x).length > 0
  ? null : Validation.messageKeys.surveyInfoEdit.cyclesRequired

const validateCycleMaxLength = x =>
  Object.keys(x).length <= MAX_CYCLES
  ? null : Validation.messageKeys.surveyInfoEdit.tooManyCycles

const validateCycleDates = ({dateStart, dateEnd}) =>
  isValidDate(dateStart) && isValidDate(dateEnd)
  ? null : Validation.messageKeys.invalidDate

const validateCycleStartDate = ({dateStart}) =>
  dateStart
  ? null : Validation.messageKeys.surveyInfoEdit.startDateRequired

const validateCycleStartDateBeforeEndDate = ({dateStart, dateEnd}) =>
  !dateEnd || dateStart < dateEnd
  ? null : Validation.messageKeys.surveyInfoEdit.startDateAfterEndDate

const validateCycleEndDateForAllButLast = (propName, nodeDef) => {
  const allCycles = R.path(propName.split('.').slice(0, -1), nodeDef)
  const lastCycle = Object.keys(allCycles).length - 1
  const cycleNum = +R.last( propName.split('.') )
  const { dateEnd } = cycleProps(propName, nodeDef)
  return (
    cycleNum === lastCycle || dateEnd
    ? null : Validation.messageKeys.surveyInfoEdit.endDateRequiredExceptForLastCycle
  )
}

const validateCyclesMustNotOverlap = (propName, nodeDef) => {
  const prefix = propName.replace(/\.[^.]+$/, '')
  const cycleNum = +R.last( propName.split('.') )
  const prev = cycleProps(`${prefix}.${cycleNum - 1}`, nodeDef)
  const cur = cycleProps(propName, nodeDef)
  return (
    cycleNum === 0 || !prev.dateEnd || (cur.dateStart > prev.dateEnd)
    ? null : Validation.messageKeys.surveyInfoEdit.previousCycleMustEndBeforeNextCycle
  )
}

const cycleValidatorsGlobal = [
  validateCycleMinLength,
  validateCycleMaxLength,
].map(fn => R.pipe(cycleProps, fn, toErrorKey))

const cycleValidatorsIndividual = [
  validateCycleDates,
  validateCycleStartDate,
  validateCycleStartDateBeforeEndDate,
].map(fn => R.pipe(cycleProps, fn, toErrorKey))

const cycleValidatorsContextual = [
  validateCycleEndDateForAllButLast,
  validateCyclesMustNotOverlap,
].map(fn => R.pipe(fn, toErrorKey))

const validateNewSurvey = async (survey, surveyInfos) => await Validator.validate(
  survey,
  {
    'name': [
      Validator.validateRequired(Validation.messageKeys.nameRequired),
      Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
      validateSurveyNameUniqueness(surveyInfos)
    ],
    'lang': [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.langRequired)],
  }
)

const validateSurveyInfo = async (surveyInfo, surveyInfos) => {
  const cyclePropNames = R.pipe(
    R.pathOr({}, ['props', 'cycles']),
    Object.keys,
  )(surveyInfo).map(x => `props.cycles.${x}`)

  const cycles = {}
  for (const name of cyclePropNames)
    cycles[name] = cycleValidatorsIndividual.concat(cycleValidatorsContextual)

  return await Validator.validate(
    surveyInfo,
    {
      'props.name': [
        Validator.validateRequired(Validation.messageKeys.nameRequired),
        Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
        validateSurveyNameUniqueness(surveyInfos)
      ],
      'props.cycles': cycleValidatorsGlobal,
      'props.languages': [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.langRequired)],
      'props.srs': [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.srsRequired)],
      ...cycles,
    }
  )
}

module.exports = {
  validateNewSurvey,
  validateSurveyInfo,
}
