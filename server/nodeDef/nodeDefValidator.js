const R = require('ramda')
const Promise = require('bluebird')

const {validate, validateItemPropUniqueness, validateRequired} = require('../../common/validation/validator')

const {getNodeDefType, nodeDefType} = require('../../common/survey/nodeDef')

const validateCodeList = async (propName, nodeDef) =>
  getNodeDefType(nodeDef) === nodeDefType.codeList
    ? validateRequired(propName, nodeDef)
    : null

const validateTaxonomy = async (propName, nodeDef) =>
  getNodeDefType(nodeDef) === nodeDefType.taxon
    ? validateRequired(propName, nodeDef)
    : null

const propsValidations = nodeDefs => ({
  'props.name': [validateRequired, validateItemPropUniqueness(nodeDefs)],
  'props.codeListUUID': [validateCodeList],
  'props.taxonomyUUID': [validateTaxonomy],
})

const validateNodeDef = async (nodeDefs, nodeDef) =>
  await validate(nodeDef, propsValidations(nodeDefs))

const validateNodeDefs = async (nodeDefs) =>
  await Promise.all(nodeDefs.map(async n => ({
    ...n,
    validation: await validateNodeDef(nodeDefs, n)
  })))

module.exports = {
  validateNodeDef,
  validateNodeDefs,
}

