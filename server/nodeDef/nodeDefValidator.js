const R = require('ramda')
const Promise = require('bluebird')

const {
  errorKeys,
  validate,
  validateItemPropUniqueness,
  validateRequired,
  validateNotKeyword
} = require('../../common/validation/validator')

const NodeDef = require('../../common/survey/nodeDef')
const NodeDefLayout = require('../../common/survey/nodeDefLayout')

const NodeDefExpressionValidator = require('./nodeDefExpressionValidator')
const NodeDefValidationsValidator = require('./nodeDefValidationsValidator')

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
        return errorKeys.empty
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

      if (keyAttributesCount === 0 &&
        (NodeDef.isNodeDefRoot(nodeDef) || NodeDefLayout.isRenderForm(nodeDef))) {
        return errorKeys.empty
      } else if (keyAttributesCount > NodeDef.maxKeyAttributes) {
        return errorKeys.exceedingMax
      }
    }
    return null
  }

const validateKey = nodeDefs =>
  (propName, nodeDef) => {
    if (!NodeDef.isNodeDefEntity(nodeDef) && NodeDef.isNodeDefKey(nodeDef)) {
      const keyAttributesCount = countKeyAttributes(nodeDef)(nodeDefs)

      if (keyAttributesCount > NodeDef.maxKeyAttributes) {
        return errorKeys.exceedingMax
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

const validateAdvancedProps = async nodeDef => {
  const validations = {
    defaultValues: await NodeDefExpressionValidator.validate(NodeDef.getDefaultValues(nodeDef)),
    calculatedValues: await NodeDefExpressionValidator.validate(NodeDef.getCalculatedValues(nodeDef)),
    applicable: await NodeDefExpressionValidator.validate(NodeDef.getApplicable(nodeDef)),
    validations: await NodeDefValidationsValidator.validate(NodeDef.getNodeDefValidations(nodeDef)),
  }
  const invalidValidations = R.reject(R.propEq('valid', true), validations)

  return {
    fields: invalidValidations,
    valid: R.isEmpty(invalidValidations),
  }
}

const validateNodeDef = async (nodeDefs, nodeDef) => {
  const nodeDefValidation = await validate(nodeDef, propsValidations(nodeDefs))

  const advancedPropsValidation = await validateAdvancedProps(nodeDef)

  const validation = R.pipe(
    R.mergeDeepLeft(advancedPropsValidation),
    R.assoc('valid', nodeDefValidation.valid && advancedPropsValidation.valid)
  )(nodeDefValidation)

  return validation.valid ? null : validation
}

const validateNodeDefs = async (nodeDefs) =>
  await Promise.all(nodeDefs.map(async n => ({
    ...n,
    validation: await validateNodeDef(nodeDefs, n)
  })))

module.exports = {
  validateNodeDefs,
}

