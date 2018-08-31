const R = require('ramda')
const Promise = require('bluebird')

const {validate, validateProp, validateRequired} = require('../../common/validation/validator')
const {fetchNodeDefsBySurveyId} = require('./nodeDefRepository')
const {getNodeDefName} = require('../../common/survey/nodeDef')

const validateNodeDefNameUniqueness = async (propName, nodeDef) => {
  const nodeDefs = await fetchNodeDefsBySurveyId(nodeDef.surveyId, true)

  const hasDuplicates = R.any(
    n => getNodeDefName(n) === getNodeDefName(nodeDef) && n.id !== nodeDef.id,
    nodeDefs
  )

  return hasDuplicates
    ? 'duplicate'
    : null
}

const propsValidations = {
  'props.name': [validateRequired, validateNodeDefNameUniqueness],
}

const validateNodeDef = async nodeDef =>
  await validate(nodeDef, propsValidations)

const validateNodeDefs = async (nodeDefs) =>
  await Promise.all(nodeDefs.map(async n => ({
    ...n,
    validation: await validateNodeDef(n)
  })))

module.exports = {
  validateNodeDef,
  validateNodeDefs,
}

