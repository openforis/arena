const R = require('ramda')
const Promise = require('bluebird')

const {createError, validateRequired} = require('../serverUtils/validator')
const {fetchNodeDefByName} = require('./nodeDefRepository')


const validateNodeDefNameUpdate = async (surveyId, nodeDefId, propName, value) => {
  const requiredError = validateRequired('name')({[propName]: value})
  if (requiredError)
    return requiredError

  const nodeByName = await fetchNodeDefByName(surveyId, value)
  if (nodeByName && nodeByName.id !== nodeDefId)
    return createError('duplicate')

  return null
}

const validateNodeDefPropUpdate = async (surveyId, nodeDefId, propName, value) => {
  switch (propName) {
    case 'name':
      return validateNodeDefNameUpdate(surveyId, nodeDefId, propName, value)
    default:
      return null
  }
}

const validateNodeDef = nodeDef => {

}

module.exports = {
  validateNodeDef,
  validateNodeDefPropUpdate,
}

