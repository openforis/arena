const R = require('ramda')
const Promise = require('bluebird')

const {
  validate,
  validateItemPropUniqueness,
  validateRequired,
  validateNotKeyword
} = require('../../common/validation/validator')

const NodeDef = require('../../common/survey/nodeDef')

const validateCodeList = async (propName, nodeDef) =>
  NodeDef.getNodeDefType(nodeDef) === NodeDef.nodeDefType.code
    ? validateRequired(propName, nodeDef)
    : null

const validateTaxonomy = async (propName, nodeDef) =>
  NodeDef.getNodeDefType(nodeDef) === NodeDef.nodeDefType.taxon
    ? validateRequired(propName, nodeDef)
    : null

const validateKeyAttributes = (nodeDefs) =>
  (propName, nodeDef) => {
    if (NodeDef.isNodeDefEntity(nodeDef)) {
      const keyAttributesCount = R.pipe(
        R.filter(n => NodeDef.getNodeDefParentUuid(n) === nodeDef.uuid && NodeDef.isNodeDefKey(n)),
        R.length
      )(nodeDefs)

      if (NodeDef.isNodeDefRoot(nodeDef) && keyAttributesCount === 0) {
        return 'empty'
      } else if (keyAttributesCount > NodeDef.maxKeyAttributes) {
        return 'exceedingMax'
      }
    }
    return null
  }

const validateKey = nodeDefs =>
  (propName, nodeDef) => {
    if (!NodeDef.isNodeDefEntity(nodeDef) && NodeDef.isNodeDefKey(nodeDef)) {
      const keyAttributesCount = R.pipe(
        R.filter(n => NodeDef.getNodeDefParentUuid(n) === NodeDef.getNodeDefParentUuid(nodeDef) && NodeDef.isNodeDefKey(n)),
        R.length
      )(nodeDefs)

      if (keyAttributesCount > NodeDef.maxKeyAttributes) {
        return 'exceedingMax'
      }
    }
    return null
  }

const propsValidations = nodeDefs => ({
  'props.name': [
    validateRequired,
    validateNotKeyword,
    validateItemPropUniqueness(nodeDefs)
  ],
  'props.categoryUuid': [validateCodeList],
  'props.taxonomyUuid': [validateTaxonomy],
  'props.key': [validateKey(nodeDefs)],
  'keyAttributes': [validateKeyAttributes(nodeDefs)]
})

const validateNodeDef = async (nodeDefs, nodeDef) =>
  await validate(nodeDef, propsValidations(nodeDefs))

const validateNodeDefs = async (nodeDefs) =>
  await Promise.all(nodeDefs.map(async n => ({
    ...n,
    validation: await validateNodeDef(nodeDefs, n)
  })))

module.exports = {
  validateNodeDefs,
}

