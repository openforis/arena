const R = require('ramda')
const Promise = require('bluebird')

const {
  errorKeys,
  validate,
  validateItemPropUniqueness,
  validateRequired,
  validateNotKeyword,
  cleanup
} = require('../../common/validation/validator')

const Survey = require('../../common/survey/survey')
const SurveyUtils = require('../../common/survey/surveyUtils')
const NodeDef = require('../../common/survey/nodeDef')
const NodeDefLayout = require('../../common/survey/nodeDefLayout')

const NodeDefExpressionsValidator = require('./nodeDefExpressionsValidator')
const NodeDefValidationsValidator = require('./nodeDefValidationsValidator')

const {keys, propKeys} = NodeDef

const validateCategory = async (propName, nodeDef) =>
  NodeDef.getNodeDefType(nodeDef) === NodeDef.nodeDefType.code
    ? validateRequired(propName, nodeDef)
    : null

const validateTaxonomy = async (propName, nodeDef) =>
  NodeDef.getNodeDefType(nodeDef) === NodeDef.nodeDefType.taxon
    ? validateRequired(propName, nodeDef)
    : null

const validateChildren = survey =>
  (propName, nodeDef) => {
    if (NodeDef.isNodeDefEntity(nodeDef)) {
      const children = Survey.getNodeDefChildren(nodeDef)(survey)
      if (R.isEmpty(children)) {
        return errorKeys.empty
      }
    }
    return null
  }

const countKeyAttributes = (survey, nodeDefEntity) => R.pipe(
  Survey.getNodeDefChildren(nodeDefEntity),
  R.filter(NodeDef.isNodeDefKey),
  R.length
)(survey)

const validateKeyAttributes = survey =>
  (propName, nodeDef) => {
    if (NodeDef.isNodeDefEntity(nodeDef)) {
      const keyAttributesCount = countKeyAttributes(survey, nodeDef)

      if (keyAttributesCount === 0 &&
        (
          NodeDef.isNodeDefRoot(nodeDef) ||
          (NodeDefLayout.isRenderForm(nodeDef) && NodeDef.isNodeDefMultiple(nodeDef))
        )
      ) {
        return errorKeys.empty
      } else if (keyAttributesCount > NodeDef.maxKeyAttributes) {
        return errorKeys.exceedingMax
      }
    }
    return null
  }

const validateKey = survey =>
  (propName, nodeDef) => {
    if (!NodeDef.isNodeDefEntity(nodeDef) && NodeDef.isNodeDefKey(nodeDef)) {
      const keyAttributesCount = countKeyAttributes(survey, nodeDef)

      if (keyAttributesCount > NodeDef.maxKeyAttributes) {
        return errorKeys.exceedingMax
      }
    }
    return null
  }

const propsValidations = survey => ({
  [`${keys.props}.${propKeys.name}`]: [
    validateRequired,
    validateNotKeyword,
    validateItemPropUniqueness(Survey.getNodeDefsArray(survey))
  ],
  [`${keys.props}.${propKeys.categoryUuid}`]: [validateCategory],
  [`${keys.props}.${propKeys.taxonomyUuid}`]: [validateTaxonomy],
  [`${keys.props}.${propKeys.key}`]: [validateKey(survey)],
  'keyAttributes': [validateKeyAttributes(survey)],
  'children': [validateChildren(survey)],
})

const validateAdvancedProps = async (survey, nodeDef) => {
  const validations = {
    defaultValues: await NodeDefExpressionsValidator.validate(survey, nodeDef, NodeDef.getDefaultValues(nodeDef)),
    calculatedValues: await NodeDefExpressionsValidator.validate(survey, nodeDef, NodeDef.getCalculatedValues(nodeDef)),
    applicable: await NodeDefExpressionsValidator.validate(survey, nodeDef, NodeDef.getApplicable(nodeDef)),
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
    R.assoc('valid', nodeDefValidation.valid && advancedPropsValidation.valid)
  )(nodeDefValidation)

  return validation.valid ? null : validation
}

const validateNodeDefs = async (nodeDefs) => {
  const survey = Survey.assocNodeDefs(nodeDefs)({})

  const nodeDefsValidated = await Promise.all(
    Survey.getNodeDefsArray(survey).map(
      async n => ({
        ...n,
        validation: await validateNodeDef(survey, n)
      })
    )
  )

  return SurveyUtils.toUuidIndexedObj(nodeDefsValidated)
}

module.exports = {
  validateNodeDefs,
}

