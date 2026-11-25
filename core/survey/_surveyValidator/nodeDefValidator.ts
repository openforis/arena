import {
  ArenaAnyNodeDef,
  type ArenaSurvey,
  type ArenaValidation,
  NodeDefExpressionValidator,
} from '@openforis/arena-core'

import * as A from '@core/arena'
import { isHexColor } from '@core/colorUtils'
import * as Validation from '@core/validation/validation'
import * as Validator from '@core/validation/validator'
import * as NodeDef from '../nodeDef'
import * as NodeDefLayout from '../nodeDefLayout'
import * as Survey from '../survey'

import * as NodeDefExpressionsValidator from './nodeDefExpressionsValidator'
import * as NodeDefValidationsValidator from './nodeDefValidationsValidator'

const { keys, keysPropsAdvanced, propKeys } = NodeDef

type ValidationOrNull = ArenaValidation | null

const keysValidationFields = {
  children: 'children',
  keyAttributes: 'keyAttributes',
  qualifierApplicable: 'qualifierApplicable',
  qualifierEditableIf: 'qualifierEditableIf',
  qualifierDefaultValues: 'qualifierDefaultValues',
  qualifierValidations: 'qualifierValidations',
}

const MAX_FILE_SIZE_MAX = 100 // max size of files that can be uploaded using file attribute

const nodeDefExpressionValidator = new NodeDefExpressionValidator()

const validateCategory = (propName: string, nodeDef: ArenaAnyNodeDef) =>
  NodeDef.getType(nodeDef) === NodeDef.nodeDefType.code
    ? Validator.validateRequired(Validation.messageKeys.nodeDefEdit.categoryRequired)(propName, nodeDef)
    : null

const validateTaxonomy = (propName: string, nodeDef: ArenaAnyNodeDef) =>
  NodeDef.getType(nodeDef) === NodeDef.nodeDefType.taxon
    ? Validator.validateRequired(Validation.messageKeys.nodeDefEdit.taxonomyRequired)(propName, nodeDef)
    : null

const validateChildren = (survey: ArenaSurvey) => (_propName: string, nodeDef: ArenaAnyNodeDef) => {
  if (NodeDef.isEntity(nodeDef) && !NodeDef.isVirtual(nodeDef)) {
    const children = Survey.getNodeDefChildren({ nodeDef, includeAnalysis: NodeDef.isAnalysis(nodeDef) })(survey)
    if (A.isEmpty(children)) {
      return { key: Validation.messageKeys.nodeDefEdit.childrenEmpty }
    }
  }

  return null
}

const countKeyAttributes = (survey: ArenaSurvey, nodeDefEntity: ArenaAnyNodeDef): number =>
  Survey.getNodeDefChildren({ nodeDef: nodeDefEntity, includeAnalysis: NodeDef.isAnalysis(nodeDefEntity) })(
    survey
  ).filter(NodeDef.isKey).length

const validateKeyAttributes = (survey: ArenaSurvey) => (_propName: string, nodeDef: ArenaAnyNodeDef) => {
  if (NodeDef.isEntity(nodeDef) && !NodeDef.isVirtual(nodeDef)) {
    const keyAttributesCount = countKeyAttributes(survey, nodeDef)

    if (keyAttributesCount === 0 && (NodeDef.isRoot(nodeDef) || NodeDef.isMultiple(nodeDef))) {
      return { key: Validation.messageKeys.nodeDefEdit.keysEmpty }
    }

    if (keyAttributesCount > NodeDef.maxKeyAttributes) {
      return { key: Validation.messageKeys.nodeDefEdit.keysExceedingMax }
    }
  }

  return null
}

const validateKey = (survey: ArenaSurvey) => (_propName: string, nodeDef: ArenaAnyNodeDef) => {
  if (!NodeDef.isEntity(nodeDef) && NodeDef.isKey(nodeDef)) {
    const keyAttributesCount = countKeyAttributes(survey, nodeDef)

    if (keyAttributesCount > NodeDef.maxKeyAttributes) {
      return { key: Validation.messageKeys.nodeDefEdit.keysExceedingMax }
    }
  }

  return null
}

const validateReadOnly = (_propName: string, nodeDef: ArenaAnyNodeDef) => {
  if (!NodeDef.isReadOnly(nodeDef)) {
    return null
  }
  if (A.isEmpty(NodeDef.getDefaultValues(nodeDef))) {
    return { key: Validation.messageKeys.nodeDefEdit.defaultValuesNotSpecified }
  }
  if (!A.isEmpty(NodeDef.getEditableIf(nodeDef))) {
    return { key: Validation.messageKeys.nodeDefEdit.readOnlyCannotHaveEditableIf }
  }
  return null
}

// a qualifier attribute value is always managed by the system (auto-filled based on the user's group,
// then only survey admins may correct it, see canEditQualifierAttributeValue in authorizer.ts), so
// designer-configured applicable/editability rules for it are meaningless and must be cleared
const validateQualifierApplicable = (_propName: string, nodeDef: ArenaAnyNodeDef) => {
  if (NodeDef.isQualifier(nodeDef) && !A.isEmpty(NodeDef.getApplicable(nodeDef))) {
    return { key: Validation.messageKeys.nodeDefEdit.qualifierCannotHaveApplicableExpression }
  }
  return null
}

const validateQualifierEditableIf = (_propName: string, nodeDef: ArenaAnyNodeDef) => {
  if (NodeDef.isQualifier(nodeDef) && (NodeDef.isReadOnly(nodeDef) || !A.isEmpty(NodeDef.getEditableIf(nodeDef)))) {
    return { key: Validation.messageKeys.nodeDefEdit.qualifierCannotHaveEditabilityRule }
  }
  return null
}

// a qualifier attribute value is always system-assigned, so a default value would never be applied,
// and being effectively read-only, it can never be validated against required/unique/count/expression rules
const validateQualifierDefaultValues = (_propName: string, nodeDef: ArenaAnyNodeDef) => {
  if (NodeDef.isQualifier(nodeDef) && NodeDef.hasDefaultValues(nodeDef)) {
    return { key: Validation.messageKeys.nodeDefEdit.qualifierCannotHaveDefaultValues }
  }
  return null
}

const validateQualifierValidations = (_propName: string, nodeDef: ArenaAnyNodeDef) => {
  if (NodeDef.isQualifier(nodeDef) && NodeDef.hasValidationsDefined(nodeDef)) {
    return { key: Validation.messageKeys.nodeDefEdit.qualifierCannotHaveValidations }
  }
  return null
}

const validateParentEntityUuid = (_propName: string, nodeDef: ArenaAnyNodeDef) => {
  if (NodeDef.isAnalysis(nodeDef) && A.isNil(NodeDef.getParentUuid(nodeDef))) {
    const errorKey = NodeDef.isVirtual(nodeDef)
      ? Validation.messageKeys.nodeDefEdit.entitySourceRequired
      : Validation.messageKeys.nodeDefEdit.analysisParentEntityRequired
    return { key: errorKey }
  }
  return null
}

const validateVirtualEntityFormula = async (
  survey: ArenaSurvey,
  nodeDef: ArenaAnyNodeDef
): Promise<ValidationOrNull> =>
  NodeDef.isVirtual(nodeDef) && !A.isEmpty(NodeDef.getFormula(nodeDef))
    ? NodeDefExpressionsValidator.validate(survey, nodeDef, Survey.dependencyTypes.formula)
    : null

const validateItemsFilterExpression = async (
  survey: ArenaSurvey,
  nodeDef: ArenaAnyNodeDef
): Promise<ValidationOrNull> => {
  const expression = NodeDef.getItemsFilter(nodeDef)
  if (A.isEmpty(expression)) return null

  const { validationResult } = await nodeDefExpressionValidator.validate({
    survey,
    nodeDefCurrent: nodeDef,
    expression,
    selfReferenceAllowed: true,
    itemsFilter: true,
  })
  return validationResult && !validationResult.valid ? Validation.newInstance(false, {}, [validationResult]) : null
}

const validateFileNameExpression = async (survey: ArenaSurvey, nodeDef: ArenaAnyNodeDef): Promise<ValidationOrNull> => {
  const expression = NodeDef.getFileNameExpression(nodeDef)
  if (A.isEmpty(expression)) return null

  const { validationResult } = await nodeDefExpressionValidator.validate({
    survey,
    nodeDefCurrent: nodeDef,
    expression,
    selfReferenceAllowed: false,
  })
  return validationResult && !validationResult.valid ? Validation.newInstance(false, {}, [validationResult]) : null
}

const validateEnumeratingItemsExpression = async (
  survey: ArenaSurvey,
  nodeDef: ArenaAnyNodeDef
): Promise<ValidationOrNull> => {
  if (!NodeDef.isEntity(nodeDef) || !NodeDef.isEnumerate(nodeDef)) return null

  const expression = NodeDef.getEnumeratingItemsExpression(nodeDef)
  if (A.isEmpty(expression)) return null

  const { validationResult } = await nodeDefExpressionValidator.validate({
    survey,
    nodeDefCurrent: nodeDef,
    expression,
    selfReferenceAllowed: false,
  })
  return validationResult && !validationResult.valid ? Validation.newInstance(false, {}, [validationResult]) : null
}

const validateColumnWidth =
  ({ survey }: { survey: ArenaSurvey }) =>
  (_propName: string, nodeDef: ArenaAnyNodeDef) => {
    const surveyInfo = Survey.getSurveyInfo(survey)
    const min = NodeDefLayout.columnWidthMinPx
    const max = NodeDefLayout.columnWidthMaxPx
    for (const cycle of Survey.getCycleKeys(surveyInfo)) {
      const width = Number(NodeDefLayout.getColumnWidthValue(cycle)(nodeDef))
      if (width < min) {
        return { key: Validation.messageKeys.nodeDefEdit.columnWidthCannotBeLessThan, params: { min } }
      }
      if (width > max) {
        return { key: Validation.messageKeys.nodeDefEdit.columnWidthCannotBeGreaterThan, params: { max } }
      }
    }
    return null
  }

const validateMaxFileSize = (_propName: string, nodeDef: ArenaAnyNodeDef) => {
  if (!NodeDef.isFile(nodeDef)) return null

  const maxSize = NodeDef.getMaxFileSize(nodeDef)

  if (maxSize <= 0 || maxSize > MAX_FILE_SIZE_MAX) {
    return { key: Validation.messageKeys.nodeDefEdit.maxFileSizeInvalid, params: { max: MAX_FILE_SIZE_MAX } }
  }
  return null
}

// the color goes into the map layers control HTML and marker styles
const validateMapMarkerColor = (_propName: string, nodeDef: ArenaAnyNodeDef) => {
  const color = NodeDef.getMapMarkerColor(nodeDef)
  if (A.isEmpty(color) || isHexColor(color)) return null
  return { key: Validation.messageKeys.nodeDefEdit.mapMarkerColorInvalid }
}

const validateNameIsNotKeyword = (propName: string, nodeDef: ArenaAnyNodeDef) => {
  if (NodeDef.isSampling(nodeDef)) return null
  return Validator.validateNotKeyword(Validation.messageKeys.nameCannotBeKeyword)(propName, nodeDef)
}

const propsValidations = (survey: ArenaSurvey) => ({
  [`${keys.props}.${propKeys.name}`]: [
    Validator.validateRequired(Validation.messageKeys.nameRequired),
    validateNameIsNotKeyword,
    Validator.validateName(Validation.messageKeys.nodeDefEdit.nameInvalid),
    Validator.validateItemPropUniqueness(Validation.messageKeys.nameDuplicate)(Survey.getNodeDefsArray(survey)),
  ],
  [`${keys.props}.${propKeys.key}`]: [validateKey(survey)],
  [`${keys.props}.${propKeys.readOnly}`]: [validateReadOnly],
  [keysValidationFields.qualifierApplicable]: [validateQualifierApplicable],
  [keysValidationFields.qualifierEditableIf]: [validateQualifierEditableIf],
  [keysValidationFields.qualifierDefaultValues]: [validateQualifierDefaultValues],
  [keysValidationFields.qualifierValidations]: [validateQualifierValidations],
  [keysValidationFields.keyAttributes]: [validateKeyAttributes(survey)],
  [keysValidationFields.children]: [validateChildren(survey)],
  // Virtual Entity
  [`${keys.parentUuid}`]: [validateParentEntityUuid],
  // Layout
  [`${keys.props}.${propKeys.layout}.${NodeDefLayout.keys.columnWidth}`]: [validateColumnWidth({ survey })],
  // Decimal
  [`${keys.props}.${propKeys.maxNumberDecimalDigits}`]: [
    Validator.validatePositiveOrZeroNumber(Validation.messageKeys.invalidNumber),
  ],
  // Code
  [`${keys.props}.${propKeys.categoryUuid}`]: [validateCategory],
  // Coordinate
  [`${keys.props}.${propKeys.mapMarkerColor}`]: [validateMapMarkerColor],
  // File
  [`${keys.props}.${propKeys.maxFileSize}`]: [validateMaxFileSize],
  // Taxon
  [`${keys.props}.${propKeys.taxonomyUuid}`]: [validateTaxonomy],
})

const validateAdvancedProps = async (survey: ArenaSurvey, nodeDef: ArenaAnyNodeDef): Promise<ArenaValidation> => {
  const validatorsByProp: Record<string, Promise<ValidationOrNull>> = {
    [keysPropsAdvanced.defaultValues]: NodeDefExpressionsValidator.validate(
      survey,
      nodeDef,
      Survey.dependencyTypes.defaultValues
    ),
    [keysPropsAdvanced.applicable]: NodeDefExpressionsValidator.validate(
      survey,
      nodeDef,
      Survey.dependencyTypes.applicable
    ),
    [keysPropsAdvanced.validations]: NodeDefValidationsValidator.validate(survey, nodeDef),
    [keysPropsAdvanced.formula]: validateVirtualEntityFormula(survey, nodeDef),
    [keysPropsAdvanced.itemsFilter]: validateItemsFilterExpression(survey, nodeDef),
    [keysPropsAdvanced.fileNameExpression]: validateFileNameExpression(survey, nodeDef),
    [keysPropsAdvanced.enumeratingItemsExpression]: validateEnumeratingItemsExpression(survey, nodeDef),
  }
  const validationResultsArray = await Promise.all(Object.values(validatorsByProp))
  const validationResultsByProp: Record<string, ValidationOrNull> = {}
  for (const [index, prop] of Object.keys(validatorsByProp).entries()) {
    validationResultsByProp[prop] = validationResultsArray[index]
  }
  const valid = A.all(Validation.isValid, validationResultsArray)
  const notValidValidationsByProp = A.reject(Validation.isValid, validationResultsByProp)

  return Validation.newInstance(valid, notValidValidationsByProp)
}

export const validateNodeDef = async (survey: ArenaSurvey, nodeDef: ArenaAnyNodeDef): Promise<ValidationOrNull> => {
  const nodeDefValidation = await Validator.validate(nodeDef, propsValidations(survey))

  const advancedPropsValidation = await validateAdvancedProps(survey, nodeDef)

  const valid = Validation.isValid(nodeDefValidation) && Validation.isValid(advancedPropsValidation)
  if (valid) return null

  return A.pipe(A.mergeDeepLeft(advancedPropsValidation), Validation.setValid(valid))(nodeDefValidation)
}

export const validateNodeDefs = async (survey: ArenaSurvey): Promise<ArenaValidation> => {
  const nodeDefs = Survey.getNodeDefs(survey)

  const nodeDefsValidation: ValidationOrNull[] = []
  for (const nodeDef of Object.values(nodeDefs)) {
    nodeDefsValidation.push(await validateNodeDef(survey, nodeDef)) // NOSONAR
  }

  // exclude valid node def validations
  const fieldsValidation: Record<string, ArenaValidation> = {}
  for (const [index, nodeDef] of Object.values(nodeDefs).entries()) {
    const nodeDefValidation = nodeDefsValidation[index]
    if (!Validation.isValid(nodeDefValidation)) {
      fieldsValidation[nodeDef.uuid] = nodeDefValidation
    }
  }

  return Validation.newInstance(A.isEmpty(fieldsValidation), fieldsValidation)
}

// ===== CHECK

export const isValidationValidOrHasOnlyMissingChildrenErrors = (
  nodeDef: ArenaAnyNodeDef,
  validation: ValidationOrNull
): boolean => {
  if (Validation.isValid(validation)) {
    return true
  }

  if (NodeDef.isEntity(nodeDef)) {
    // Empty new entity (only missing children or key attributes errors)
    const hasOnlyChildrenOrKeyAttributesErrors = A.pipe(
      Validation.getFieldValidations,
      A.keys,
      A.without([keysValidationFields.children, keysValidationFields.keyAttributes]),
      A.isEmpty
    )(validation)

    if (hasOnlyChildrenOrKeyAttributesErrors) {
      return true
    }
  }

  return false
}
