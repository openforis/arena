const R = require('ramda')
const Promise = require('bluebird')

const {
  validate,
  validateItemPropUniqueness,
  validateRequired,
  validateNotKeyword
} = require('../../common/validation/validator')

const NodeDef = require('../../common/survey/nodeDef')

const validateCategory = async (propName, nodeDef) =>
  NodeDef.getNodeDefType(nodeDef) === NodeDef.nodeDefType.code
    ? validateRequired(propName, nodeDef)
    : null

const validateTaxonomy = async (propName, nodeDef) =>
  NodeDef.getNodeDefType(nodeDef) === NodeDef.nodeDefType.taxon
    ? validateRequired(propName, nodeDef)
    : null

const getChildren = nodeDefEntity => allNodeDefs =>
  R.filter(n => NodeDef.getNodeDefParentUuid(n) === nodeDefEntity.uuid)(allNodeDefs)

const validateChildren = (nodeDefs) =>
  (propName, nodeDef) => {
    if (NodeDef.isNodeDefEntity(nodeDef)) {
      const children = getChildren(nodeDef)(nodeDefs)
      if (R.isEmpty(children)) {
        return 'empty'
      }
    }
    return null
  }

const countKeyAttributes = nodeDefEntity => allNodeDefs => R.pipe(
  getChildren(nodeDefEntity),
  R.filter(NodeDef.isNodeDefKey),
  R.length
)(allNodeDefs)

const validateKeyAttributes = (nodeDefs) =>
  (propName, nodeDef) => {
    if (NodeDef.isNodeDefEntity(nodeDef)) {
      const keyAttributesCount = countKeyAttributes(nodeDef)(nodeDefs)

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
      const keyAttributesCount = countKeyAttributes(nodeDef)(nodeDefs)

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
  'props.categoryUuid': [validateCategory],
  'props.taxonomyUuid': [validateTaxonomy],
  'props.key': [validateKey(nodeDefs)],
  'keyAttributes': [validateKeyAttributes(nodeDefs)],
  'children': [validateChildren(nodeDefs)]
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

