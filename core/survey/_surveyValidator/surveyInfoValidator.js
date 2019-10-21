const R = require('ramda')

const Validator = require('../../validation/validator')
const Validation = require('../../validation/validation')

const validateSurveyNameUniqueness = surveyInfos => (propName, survey) => {
  return !R.isEmpty(surveyInfos) && R.find(s => s.id !== survey.id, surveyInfos)
    ? { key: Validation.messageKeys.nameDuplicate }
    : null
}

const validateCycles = (propName, nodeDef) => {
  const cycles = R.path(propName.split('.'), nodeDef)
  if (cycles.length === 0 )
    return { key: Validation.messageKeys.surveyInfoEdit.cyclesRequired }
  if (cycles.length > 10 )
    return { key: Validation.messageKeys.surveyInfoEdit.tooManyCycles }

  for (const [_key, {dateStart, dateEnd}] of Object.entries(cycles)) {
    // Maybe use `_key` to indicate which cycle is invalid?
    if (dateStart && isNaN(Date.parse(dateStart)))
      return { key: Validation.messageKeys.invalidDate }
    if (dateEnd && isNaN(Date.parse(dateEnd)))
      return { key: Validation.messageKeys.invalidDate }
    if (!dateStart)
      return { key: Validation.messageKeys.surveyInfoEdit.startDateRequired }
    if (dateEnd && dateStart > dateEnd)
      return { key: Validation.messageKeys.surveyInfoEdit.startDateAfterEndDate }
  }

  const cs = Object.values(cycles)

  // Cycles must have an end date unless it's the last cycle:
  const missingEndDates = cs.slice(0, -1).filter(x => !x.dateEnd)
  if (missingEndDates.length > 0)
    return { key: Validation.messageKeys.surveyInfoEdit.endDateRequiredExceptForLastCycle }

  // Cycles must not overlap
  const overlappingDates =
    R.zip(cs, cs.slice(1))
    .filter(([prev, cur]) => !prev.dateEnd || (cur.dateStart <= prev.dateEnd))

  if (overlappingDates.length > 0)
    return { key: Validation.messageKeys.surveyInfoEdit.previousCycleMustEndBeforeNextCycle }

  return null
}

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

const validateSurveyInfo = async (surveyInfo, surveyInfos) => await Validator.validate(
  surveyInfo,
  {
    'props.name': [
      Validator.validateRequired(Validation.messageKeys.nameRequired),
      Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
      validateSurveyNameUniqueness(surveyInfos)
    ],
    'props.cycles': [validateCycles],
    'props.languages': [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.langRequired)],
    'props.srs': [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.srsRequired)],
  }
)

module.exports = {
  validateNewSurvey,
  validateSurveyInfo,
}
