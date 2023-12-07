import * as R from 'ramda'

import { NodeDefExpressionValidator } from '@openforis/arena-core'

import * as Validator from '@core/validation/validator'
import * as Validation from '@core/validation/validation'
import * as PromiseUtils from '@core/promiseUtils'

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

const MAX_FILE_SIZE_MAX = 100 // max size of files that can be uploaded using file attribute

const nodeDefExpressionValidator = new NodeDefExpressionValidator()

const validateCategory = async (propName, nodeDef) =>
  NodeDef.getType(nodeDef) === NodeDef.nodeDefType.code
    ? Validator.validateRequired(Validation.messageKeys.nodeDefEdit.categoryRequired)(propName, nodeDef)
    : null

const validateTaxonomy = async (propName, nodeDef) =>
  NodeDef.getType(nodeDef) === NodeDef.nodeDefType.taxon
    ? Validator.validateRequired(Validation.messageKeys.nodeDefEdit.taxonomyRequired)(propName, nodeDef)
    : null

const validateChildren = (survey) => (propName, nodeDef) => {
  if (NodeDef.isEntity(nodeDef) && !NodeDef.isVirtual(nodeDef)) {
    const children = Survey.getNodeDefChildren(nodeDef, NodeDef.isAnalysis(nodeDef))(survey)
    if (R.isEmpty(children)) {
      return { key: Validation.messageKeys.nodeDefEdit.childrenEmpty }
    }
  }

  return null
}

const countKeyAttributes = (survey, nodeDefEntity) =>
  R.pipe(
    Survey.getNodeDefChildren(nodeDefEntity, NodeDef.isAnalysis(nodeDefEntity)),
    R.filter(NodeDef.isKey),
    R.length
  )(survey)

const validateKeyAttributes = (survey) => (propName, nodeDef) => {
  if (NodeDef.isEntity(nodeDef) && !NodeDef.isVirtual(nodeDef)) {
    const keyAttributesCount = countKeyAttributes(survey, nodeDef)

    if (
      keyAttributesCount === 0 &&
      (NodeDef.isRoot(nodeDef) || (NodeDefLayout.isRenderForm(nodeDef) && NodeDef.isMultiple(nodeDef)))
    ) {
      return { key: Validation.messageKeys.nodeDefEdit.keysEmpty }
    }

    if (keyAttributesCount > NodeDef.maxKeyAttributes) {
      return { key: Validation.messageKeys.nodeDefEdit.keysExceedingMax }
    }
  }

  return null
}

const validateKey = (survey) => (propName, nodeDef) => {
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

const validateParentEntityUuid = (_propName, nodeDef) => {
  if (NodeDef.isAnalysis(nodeDef) && R.isNil(NodeDef.getParentUuid(nodeDef))) {
    const errorKey = NodeDef.isVirtual(nodeDef)
      ? Validation.messageKeys.nodeDefEdit.entitySourceRequired
      : Validation.messageKeys.nodeDefEdit.analysisParentEntityRequired
    return { key: errorKey }
  }
  return null
}

const validateVirtualEntityFormula = (survey, nodeDef) =>
  NodeDef.isVirtual(nodeDef) && !R.isEmpty(NodeDef.getFormula(nodeDef))
    ? NodeDefExpressionsValidator.validate(survey, nodeDef, Survey.dependencyTypes.formula)
    : null

const validateItemsFilterExpression = (survey, nodeDef) => {
  if (R.isEmpty(NodeDef.getItemsFilter(nodeDef))) return null

  const { validationResult } = nodeDefExpressionValidator.validate({
    survey,
    nodeDefCurrent: nodeDef,
    expression: NodeDef.getItemsFilter(nodeDef),
    isContextParent: true,
    selfReferenceAllowed: true,
    itemsFilter: true,
  })
  if (validationResult && !validationResult.valid) {
    return Validation.newInstance(false, {}, [validationResult])
  }
  return null
}

const validateColumnWidth =
  ({ survey }) =>
  (_propName, nodeDef) => {
    const surveyInfo = Survey.getSurveyInfo(survey)
    const cycles = Survey.getCycleKeys(surveyInfo)
    let error = null
    cycles.some((cycle) => {
      const width = NodeDefLayout.getColumnWidthValue(cycle)(nodeDef)
      const min = NodeDefLayout.columnWidthMinPx
      if (width < min) {
        error = { key: Validation.messageKeys.nodeDefEdit.columnWidthCannotBeLessThan, params: { min } }
        // break the loop
        return true
      }
      const max = NodeDefLayout.columnWidthMaxPx
      if (width > max) {
        error = { key: Validation.messageKeys.nodeDefEdit.columnWidthCannotBeGreaterThan, params: { max } }
        // break the loop
        return true
      }
      return false
    })
    return error
  }

const validateMaxFileSize = (_propName, nodeDef) => {
  if (!NodeDef.isFile(nodeDef)) return null

  const maxSize = NodeDef.getMaxFileSize(nodeDef)

  if (maxSize <= 0 || maxSize > MAX_FILE_SIZE_MAX) {
    return {
      key: Validation.messageKeys.nodeDefEdit.maxFileSizeInvalid,
      params: { max: MAX_FILE_SIZE_MAX },
    }
  }
  return null
}

const validateNameIsNotKeyword = (propName, nodeDef) => {
  if (NodeDef.isSampling(nodeDef)) return null
  return Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword)(propName, nodeDef)
}

const propsValidations = (survey) => ({
  [`${keys.props}.${propKeys.name}`]: [
    Validator.validateRequired(Validation.messageKeys.nameRequired),
    validateNameIsNotKeyword,
    Validator.validateName(Validation.messageKeys.nodeDefEdit.nameInvalid),
    Validator.validateItemPropUniqueness(Validation.messageKeys.nameDuplicate)(Survey.getNodeDefsArray(survey)),
  ],
  [`${keys.props}.${propKeys.key}`]: [validateKey(survey)],
  [`${keys.props}.${propKeys.readOnly}`]: [validateReadOnly],
  [keysValidationFields.keyAttributes]: [validateKeyAttributes(survey)],
  [keysValidationFields.children]: [validateChildren(survey)],
  // Virtual Entity
  [`${keys.parentUuid}`]: [validateParentEntityUuid],
  // Layout
  [`${keys.props}.${propKeys.layout}.${NodeDefLayout.keys.columnWidth}`]: [validateColumnWidth({ survey })],
  // Decimal
  [`${keys.props}.${propKeys.maxNumberDecimalDigits}`]: [
    Validator.validatePositiveNumber(Validation.messageKeys.invalidNumber),
  ],
  // Code
  [`${keys.props}.${propKeys.categoryUuid}`]: [validateCategory],
  // File
  [`${keys.props}.${propKeys.maxFileSize}`]: [validateMaxFileSize],
  // Taxon
  [`${keys.props}.${propKeys.taxonomyUuid}`]: [validateTaxonomy],
})

const validateAdvancedProps = async (survey, nodeDef) => {
  const [
    validationDefaultValues,
    validationApplicable,
    validationValidations,
    validationVirtualEntityFormula,
    validationItemsFilter,
  ] = await Promise.all([
    NodeDefExpressionsValidator.validate(survey, nodeDef, Survey.dependencyTypes.defaultValues),
    NodeDefExpressionsValidator.validate(survey, nodeDef, Survey.dependencyTypes.applicable),
    NodeDefValidationsValidator.validate(survey, nodeDef),
    validateVirtualEntityFormula(survey, nodeDef),
    validateItemsFilterExpression(survey, nodeDef),
  ])

  return Validation.newInstance(
    R.all(Validation.isValid, [
      validationDefaultValues,
      validationApplicable,
      validationValidations,
      validationVirtualEntityFormula,
      validationItemsFilter,
    ]),
    R.reject(Validation.isValid, {
      [NodeDef.keysPropsAdvanced.defaultValues]: validationDefaultValues,
      [NodeDef.keysPropsAdvanced.applicable]: validationApplicable,
      [NodeDef.keysPropsAdvanced.validations]: validationValidations,
      [NodeDef.keysPropsAdvanced.formula]: validationVirtualEntityFormula,
      [NodeDef.keysPropsAdvanced.itemsFilter]: validationItemsFilter,
    })
  )
}

export const validateNodeDef = async (survey, nodeDef) => {
  const nodeDefValidation = await Validator.validate(nodeDef, propsValidations(survey))

  const advancedPropsValidation = await validateAdvancedProps(survey, nodeDef)

  const valid = Validation.isValid(nodeDefValidation) && Validation.isValid(advancedPropsValidation)
  if (valid) return null

  return R.pipe(R.mergeDeepLeft(advancedPropsValidation), Validation.setValid(valid))(nodeDefValidation)
}

export const validateNodeDefs = async (survey) => {
  const nodeDefs = Survey.getNodeDefs(survey)

  const nodeDefsValidation = []
  await PromiseUtils.each(Object.values(nodeDefs), async (nodeDef) => {
    nodeDefsValidation.push(await validateNodeDef(survey, nodeDef))
  })

  // exclude valid node def validations
  const fieldsValidation = Object.values(nodeDefs).reduce((fieldsValidationAcc, nodeDef, index) => {
    const nodeDefValidation = nodeDefsValidation[index]
    return {
      ...fieldsValidationAcc,
      ...(Validation.isValid(nodeDefValidation) ? {} : { [nodeDef.uuid]: nodeDefValidation }),
    }
  }, {})

  return Validation.newInstance(R.isEmpty(fieldsValidation), fieldsValidation)
}

// ===== CHECK

export const isValidationValidOrHasOnlyMissingChildrenErrors = (nodeDef, validation) => {
  if (Validation.isValid(validation)) {
    return true
  }

  if (NodeDef.isEntity(nodeDef)) {
    // Empty new entity (only missing children or key attributes errors)
    const hasOnlyChildrenOrKeyAttributesErrors = R.pipe(
      Validation.getFieldValidations,
      R.keys,
      R.without([keysValidationFields.children, keysValidationFields.keyAttributes]),
      R.isEmpty
    )(validation)

    if (hasOnlyChildrenOrKeyAttributesErrors) {
      return true
    }
  }

  return false
}
