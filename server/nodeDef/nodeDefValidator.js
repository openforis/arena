const R = require('ramda')
const Promise = require('bluebird')

const {createError, validateRequired, assocValidation} = require('../serverUtils/validator')
const {fetchNodeDefsBySurveyId} = require('./nodeDefRepository')
const {nodeDefType} = require('../../common/survey/nodeDef')

const validateNodeDefName = async (nodeDef) => {
  const requiredError = validateRequired('props.name', nodeDef)
  if (requiredError)
    return requiredError

  const nodeDefsAll = await fetchNodeDefsBySurveyId(nodeDef.surveyId, true)
  const nodeDefsByName = nodeDefsAll.filter(n => n.props.name === nodeDef.props.name)

  if (!R.isEmpty(nodeDefsByName) && R.find(n => n.id != nodeDef.id)(nodeDefsByName))
    return createError('duplicate')

  return null
}

const validateNodeDefProp = async (nodeDef, propName) => {
  switch (propName) {
    case 'name':
      return validateNodeDefName(nodeDef)
    default:
      return null
  }
}

const validateNodeDef = async (nodeDef) => {
  const [nameValidation] = await Promise.all([
    validateNodeDefName(nodeDef),
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
    validation: await validateNodeDef(n)
  })))

module.exports = {
  validateNodeDef,
  validateNodeDefs,
  validateNodeDefProp,
}

