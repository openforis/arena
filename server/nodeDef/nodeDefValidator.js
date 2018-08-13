const R = require('ramda')
const Promise = require('bluebird')

const {createError, validateRequired, assocValidation} = require('../serverUtils/validator')
const {fetchNodeDefsBySurveyId} = require('./nodeDefRepository')
const {nodeDefType} = require('../../common/survey/nodeDef')

const validateNodeDefName = async (nodeDef, newNode = true) => {
  const requiredError = validateRequired('props.name', nodeDef)
  if (requiredError)
    return requiredError

  const nodeDefsAll = await fetchNodeDefsBySurveyId(nodeDef.surveyId, true)
  const nodeDefsByName = nodeDefsAll.filter(n => n.props.name === nodeDef.props.name)

  if (!R.isEmpty(nodeDefsByName) && (newNode || R.find(n => n.id != nodeDef.id)(nodeDefsByName)))
    return createError('duplicate')

  return null
}

const validateNodeDefProp = async (nodeDef, propName, newNode = true) => {
  switch (propName) {
    case 'name':
      return validateNodeDefName(nodeDef, newNode)
    default:
      return null
  }
}

const validateNodeDef = async (nodeDef, newNode) => {
  const [nameValidation] = await Promise.all([
    validateNodeDefName(nodeDef, newNode),
    //nodeDef.type === nodeDefType.codeList ? validateRequired('props.codeListId', nodeDef) : null
  ])
  return R.pipe(
    R.assocPath(['validation', 'valid'], true),
    R.partial(assocValidation, ['name', nameValidation]),
    //R.partial(assocValidation, ['codeListId', codeListIdValidation]),
    R.prop('validation'),
  )(nodeDef)
}

const validateNodeDefs = async (nodeDefs) =>
  await Promise.all(nodeDefs.map(async n => ({
    ...n,
    validation: await validateNodeDef(n, false)
  })))

module.exports = {
  validateNodeDef,
  validateNodeDefs,
  validateNodeDefProp,
}

