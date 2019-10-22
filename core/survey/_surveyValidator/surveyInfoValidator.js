const R = require('ramda')

const Validator = require('../../validation/validator')
const Validation = require('../../validation/validation')

const validateSurveyNameUniqueness = surveyInfos => (propName, survey) => {
  return !R.isEmpty(surveyInfos) && R.find(s => s.id !== survey.id, surveyInfos)
    ? { key: Validation.messageKeys.nameDuplicate }
    : null
}

const isInvalidDate = x => x && isNaN(Date.parse(x))

function* _validateCyclesIter(cs) {
  if (cs.length === 0 )
    yield { cycle: 0, key: Validation.messageKeys.surveyInfoEdit.cyclesRequired }
  if (cs.length > 10 )
    yield { cycle: 10, key: Validation.messageKeys.surveyInfoEdit.tooManyCycles }

  yield* cs.filter( ([_,v]) => isInvalidDate(v.dateStart) || isInvalidDate(v.dateEnd) )
    .map( ([cycle,_]) => ({ cycle, key: Validation.messageKeys.invalidDate }) )
  yield* cs.filter( ([_,v]) => !v.dateStart)
    .map( ([cycle,_]) => ({ cycle, key: Validation.messageKeys.surveyInfoEdit.startDateRequired }) )
  yield* cs.filter( ([_,v]) => v.dateEnd && v.dateStart > v.dateEnd )
    .map( ([cycle,_]) => ({ cycle, key: Validation.messageKeys.surveyInfoEdit.startDateAfterEndDate }) )

  // Cycles must have an end date unless it's the last cycle:
  yield*
    cs.slice(0, -1)
    .filter(([_,v]) => !v.dateEnd)
    .map( ([cycle,_]) => ({ cycle, key: Validation.messageKeys.surveyInfoEdit.endDateRequiredExceptForLastCycle }) )

  // Cycles must not overlap
  yield*
    R.zip(cs, cs.slice(1))
    .filter( ([[_k1,prev], [_k2,cur]]) => !prev.dateEnd || (cur.dateStart <= prev.dateEnd) )
    .map( ([_, cur]) => cur )
    .map( ([cycle,_]) => ({ cycle, key: Validation.messageKeys.surveyInfoEdit.previousCycleMustEndBeforeNextCycle }) )
}

const validateCycles = (propName, nodeDef) => {
  const cycles = R.path(propName.split('.'), nodeDef)
  const cs = Object.entries(cycles)
  const errors = {}, res = {}

  for (const cycle in cycles)
    errors[cycle] = []
  for (const {cycle, key} of _validateCyclesIter(cs))
    errors[cycle].push({key})
  for (const [cycle, cycleErrors] of Object.entries(errors))
    res[cycle] = Validation.newInstance(cycleErrors.length === 0, [], cycleErrors, [])

  return res
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

const validateSurveyInfo = async (surveyInfo, surveyInfos) => {
  const surveyInfoValidation = await Validator.validate(
    surveyInfo,
    {
      'props.name': [
        Validator.validateRequired(Validation.messageKeys.nameRequired),
        Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
        validateSurveyNameUniqueness(surveyInfos)
      ],
      'props.languages': [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.langRequired)],
      'props.srs': [Validator.validateRequired(Validation.messageKeys.surveyInfoEdit.srsRequired)],
    }
  )

  surveyInfoValidation.fields.cycles = validateCycles('props.cycles', surveyInfo)
  return surveyInfoValidation
}

module.exports = {
  validateNewSurvey,
  validateSurveyInfo,
}
