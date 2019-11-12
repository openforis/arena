import * as R from 'ramda'

import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'

import * as Survey from '../survey'
import * as NodeDef from '../nodeDef'
import * as NodeDefLayout from '../nodeDefLayout'

import * as NodeDefExpressionsValidator from './nodeDefExpressionsValidator'
import * as NodeDefValidationsValidator from './nodeDefValidationsValidator'

const { keys, propKeys } = NodeDef

const keysValidationFields = {
  children: 'children',
  keyAttributes: 'keyAttributes',
}

const validateCategory = async (propName, nodeDef) =>
  NodeDef.getType(nodeDef) === NodeDef.nodeDefType.code
    ? Validator.validateRequired(Validation.messageKeys.nodeDefEdit.categoryRequired)(propName, nodeDef)
    : null

const validateTaxonomy = async (propName, nodeDef) =>
  NodeDef.getType(nodeDef) === NodeDef.nodeDefType.taxon
    ? Validator.validateRequired(Validation.messageKeys.nodeDefEdit.taxonomyRequired)(propName, nodeDef)
    : null

const validateChildren = survey =>
  (propName, nodeDef) => {
    if (NodeDef.isEntity(nodeDef)) {
      const children = Survey.getNodeDefChildren(nodeDef)(survey)
      if (R.isEmpty(children)) {
        return { key: Validation.messageKeys.nodeDefEdit.childrenEmpty }
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
        return { key: Validation.messageKeys.nodeDefEdit.keysEmpty }
      } else if (keyAttributesCount > NodeDef.maxKeyAttributes) {
        return { key: Validation.messageKeys.nodeDefEdit.keysExceedingMax }
      }
    }
    return null
  }

const validateKey = survey =>
  (propName, nodeDef) => {
    if (!NodeDef.isEntity(nodeDef) && NodeDef.isKey(nodeDef)) {
      const keyAttributesCount = countKeyAttributes(survey, nodeDef)

      if (keyAttributesCount > NodeDef.maxKeyAttributes) {
        return { key: Validation.messageKeys.nodeDefEdit.keysExceedingMax }
      }
    }
    return null
  }

const validateReadOnly = (propName, nodeDef) =>
  NodeDef.isReadOnly(nodeDef) && R.isEmpty(NodeDef.getDefaultValues(nodeDef))
    ? { key: Validation.messageKeys.nodeDefEdit.defaultValuesNotSpecified }
    : null

const propsValidations = survey => ({
  [`${keys.props}.${propKeys.name}`]: [
    Validator.validateRequired(Validation.messageKeys.nameRequired),
    Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword),
    Validator.validateName(Validation.messageKeys.nodeDefEdit.nameInvalid),
    Validator.validateItemPropUniqueness(Validation.messageKeys.nameDuplicate)(Survey.getNodeDefsArray(survey))
  ],
  [`${keys.props}.${propKeys.categoryUuid}`]: [validateCategory],
  [`${keys.props}.${propKeys.taxonomyUuid}`]: [validateTaxonomy],
  [`${keys.props}.${propKeys.key}`]: [validateKey(survey)],
  [`${keys.props}.${propKeys.readOnly}`]: [validateReadOnly],
  [keysValidationFields.keyAttributes]: [validateKeyAttributes(survey)],
  [keysValidationFields.children]: [validateChildren(survey)],
})

const validateAdvancedProps = async (survey, nodeDef) => {
  const validations = await Promise.all([
    NodeDefExpressionsValidator.validate(survey, nodeDef, Survey.dependencyTypes.defaultValues),
    NodeDefExpressionsValidator.validate(survey, nodeDef, Survey.dependencyTypes.applicable),
    NodeDefValidationsValidator.validate(survey, nodeDef)
  ])

  return Validation.newInstance(
    R.all(Validation.isValid, validations),
    R.reject(
      Validation.isValid,
      {
        [NodeDef.propKeys.defaultValues]: validations[0],
        [NodeDef.propKeys.applicable]: validations[1],
        [NodeDef.propKeys.validations]: validations[2],
      }
    )
  )
}

const validateNodeDef = async (survey, nodeDef) => {
  const nodeDefValidation = await Validator.validate(nodeDef, propsValidations(survey))

  const advancedPropsValidation = await validateAdvancedProps(survey, nodeDef)

  const validation = R.pipe(
    R.mergeDeepLeft(advancedPropsValidation),
    Validation.setValid(Validation.isValid(nodeDefValidation) && Validation.isValid(advancedPropsValidation))
  )(nodeDefValidation)

  return Validation.isValid(validation) ? null : validation
}

export const validateNodeDefs = async survey => {
  // build and assoc dependency graph to survey
  survey = R.pipe(
    Survey.buildDependencyGraph,
    graph => Survey.assocDependencyGraph(graph)(survey)
  )(survey)

  const validation = Validation.newInstance()

  const nodeDefs = Survey.getNodeDefs(survey)

  for (const nodeDefUuid of Object.keys(nodeDefs)) {
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const nodeDefValidation = await validateNodeDef(survey, nodeDef)

    if (!Validation.isValid(nodeDefValidation)) {
      Validation.setField(nodeDefUuid, nodeDefValidation)(validation)
      Validation.setValid(false)(validation)
    }
  }

  return validation
}
