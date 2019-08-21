const R = require('ramda')

const Validator = require('../../validation/validator')

const {
  errorKeys,
  validate,
  validateItemPropUniqueness,
  validateRequired,
  validateNotKeyword,
  validateName,
  cleanup
} = Validator

const Survey = require('../survey')
const NodeDef = require('../nodeDef')
const NodeDefLayout = require('../nodeDefLayout')

const NodeDefExpressionsValidator = require('./nodeDefExpressionsValidator')
const NodeDefValidationsValidator = require('./nodeDefValidationsValidator')

const { keys, propKeys } = NodeDef

const nodeDefErrorKeys = {
  defaultValuesNotSpecified: 'nodeDefEdit.validationErrors.defaultValuesNotSpecified',
  childrenEmpty: 'nodeDefEdit.validationErrors.childrenEmpty',
  keysEmpty: 'nodeDefEdit.validationErrors.keysEmpty',
  keysExceedingMax: 'nodeDefEdit.validationErrors.keysExceedingMax',
}

const keysValidationFields = {
  children: 'children',
  keyAttributes: 'keyAttributes',
}

const validateCategory = async (propName, nodeDef) =>
  NodeDef.getType(nodeDef) === NodeDef.nodeDefType.code
    ? validateRequired(propName, nodeDef)
    : null

const validateTaxonomy = async (propName, nodeDef) =>
  NodeDef.getType(nodeDef) === NodeDef.nodeDefType.taxon
    ? validateRequired(propName, nodeDef)
    : null

const validateChildren = survey =>
  (propName, nodeDef) => {
    if (NodeDef.isEntity(nodeDef)) {
      const children = Survey.getNodeDefChildren(nodeDef)(survey)
      if (R.isEmpty(children)) {
        return { key: nodeDefErrorKeys.childrenEmpty }
      }
    }
    return null
  }

const countKeyAttributes = (survey, nodeDefEntity) => R.pipe(
  Survey.getNodeDefChildren(nodeDefEntity),
  R.filter(NodeDef.isKey),
  R.length
)(survey)

const validateKeyAttributes = survey =>
  (propName, nodeDef) => {
    if (NodeDef.isEntity(nodeDef)) {
      const keyAttributesCount = countKeyAttributes(survey, nodeDef)

      if (keyAttributesCount === 0 &&
        (
          NodeDef.isRoot(nodeDef) ||
          (NodeDefLayout.isRenderForm(nodeDef) && NodeDef.isMultiple(nodeDef))
        )
      ) {
        return { key: nodeDefErrorKeys.keysEmpty }
      } else if (keyAttributesCount > NodeDef.maxKeyAttributes) {
        return { key: nodeDefErrorKeys.keysExceedingMax }
      }
    }
    return null
  }

const validateKey = survey =>
  (propName, nodeDef) => {
    if (!NodeDef.isEntity(nodeDef) && NodeDef.isKey(nodeDef)) {
      const keyAttributesCount = countKeyAttributes(survey, nodeDef)

      if (keyAttributesCount > NodeDef.maxKeyAttributes) {
        return { key: errorKeys.exceedingMax }
      }
    }
    return null
  }

const validateReadOnly = (propName, nodeDef) =>
  NodeDef.isReadOnly(nodeDef) && R.isEmpty(NodeDef.getDefaultValues(nodeDef))
    ? { key: nodeDefErrorKeys.defaultValuesNotSpecified }
    : null

const propsValidations = survey => ({
  [`${keys.props}.${propKeys.name}`]: [
    validateRequired,
    validateNotKeyword,
    validateName,
    validateItemPropUniqueness(Survey.getNodeDefsArray(survey))
  ],
  [`${keys.props}.${propKeys.categoryUuid}`]: [validateCategory],
  [`${keys.props}.${propKeys.taxonomyUuid}`]: [validateTaxonomy],
  [`${keys.props}.${propKeys.key}`]: [validateKey(survey)],
  [`${keys.props}.${propKeys.readOnly}`]: [validateReadOnly],
  [keysValidationFields.keyAttributes]: [validateKeyAttributes(survey)],
  [keysValidationFields.children]: [validateChildren(survey)],
})

const validateAdvancedProps = async (survey, nodeDef) => {
  const validations = {
    defaultValues: await NodeDefExpressionsValidator.validate(survey, nodeDef, NodeDef.getDefaultValues(nodeDef)),
    applicable: await NodeDefExpressionsValidator.validate(survey, Survey.getNodeDefParent(nodeDef)(survey), NodeDef.getApplicable(nodeDef)),
    validations: await NodeDefValidationsValidator.validate(survey, nodeDef, NodeDef.getValidations(nodeDef)),
  }

  return cleanup({
    fields: validations,
    valid: true,
  })
}

const validateNodeDef = async (survey, nodeDef) => {
  const nodeDefValidation = await validate(nodeDef, propsValidations(survey))

  const advancedPropsValidation = await validateAdvancedProps(survey, nodeDef)

  const validation = R.pipe(
    R.mergeDeepLeft(advancedPropsValidation),
    R.assoc(Validator.keys.valid, Validator.isValidationValid(nodeDefValidation) && Validator.isValidationValid(advancedPropsValidation))
  )(nodeDefValidation)

  return validation.valid ? null : validation
}

const validateNodeDefs = async survey => {
  const nodeDefs = Survey.getNodeDefs(survey)
  const validation = Validator.newValidationValid()

  for (const nodeDefUuid of Object.keys(nodeDefs)) {
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const nodeDefValidation = await validateNodeDef(survey, nodeDef)

    if (!Validator.isValidationValid(nodeDefValidation)) {
      validation[Validator.keys.fields][nodeDefUuid] = nodeDefValidation
      validation[Validator.keys.valid] = false
    }
  }

  return validation
}

module.exports = {
  validateNodeDefs,
}

