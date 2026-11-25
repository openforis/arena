import {
  ArenaAnyNodeDef,
  type ArenaLabels,
  type ArenaNodeDefBoolean,
  type ArenaNodeDefCode,
  type ArenaNodeDefCoordinate,
  type ArenaNodeDefDate,
  type ArenaNodeDefDecimal,
  type ArenaNodeDefEntity,
  type ArenaNodeDefExpression,
  type ArenaNodeDefFile,
  type ArenaNodeDefFormHeader,
  type ArenaNodeDefGeo,
  type ArenaNodeDefInteger,
  type ArenaNodeDefMeta,
  type ArenaNodeDefPropsAdvanced,
  type ArenaNodeDefTaxon,
  type ArenaNodeDefText,
  type ArenaNodeDefTime,
  type ArenaNodeDefValidations,
  NodeDefs,
  NodeDefType,
  Objects,
} from '@openforis/arena-core'

import * as A from '@core/arena'
import { ArrayUtils } from '@core/arrayUtils'
import { extractCallFirstTwoArgs } from '@core/expressionParser/helpers/functionCallArgs'
import { functionNames, userDependentFunctionNames } from '@core/expressionParser/helpers/functions'
import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'
import { uuidv4 } from '@core/uuid'
import * as TextUtils from '@webapp/utils/textUtils'

import * as NodeDefExpression from './nodeDefExpression'
import * as NodeDefLayout from './nodeDefLayout'
import { nodeDefType } from './nodeDefType'
import * as NodeDefValidations from './nodeDefValidations'
import { valuePropsTaxon } from './nodeValueProps'

// Any node def; the getters below are null-tolerant (a missing parent def is a common argument).
type NodeDefUpdater = (nodeDef: ArenaAnyNodeDef) => ArenaAnyNodeDef
type NodeDefPredicate = (nodeDef: ArenaAnyNodeDef) => boolean
type PropsObject = Record<string, any>

// ObjectUtils helpers are typed on plain objects: narrow their result back to a node def.
const setProp =
  (key: string, value: unknown): NodeDefUpdater =>
  (nodeDef) =>
    ObjectUtils.setProp(key, value)(nodeDef) as ArenaAnyNodeDef

// ======== NODE DEF PROPERTIES

export { nodeDefType }

export const NodeDefLayoutElementTypes = [nodeDefType.formHeader]

export const keys = {
  id: ObjectUtils.keys.id,
  uuid: ObjectUtils.keys.uuid,
  parentUuid: ObjectUtils.keys.parentUuid,
  props: ObjectUtils.keys.props,
  propsAdvanced: 'propsAdvanced',
  propsAdvancedDraft: 'propsAdvancedDraft',
  meta: 'meta',
  draftAdvanced: 'draftAdvanced',
  draftAdvancedApplicable: 'draftAdvancedApplicable',
  draftAdvancedDefaultValues: 'draftAdvancedDefaultValues',
  draftAdvancedFileNameExpression: 'draftAdvancedFileNameExpression',
  draftAdvancedValidations: 'draftAdvancedValidations',
  type: 'type',
  deleted: 'deleted',
  analysis: 'analysis',
  published: 'published',
  temporary: 'temporary', // Not persisted yet
  // Analysis
  virtual: 'virtual', // Virtual Entity
} as const

export const NodeDefLabelTypes = {
  name: 'name',
  label: 'label',
  labelAndName: 'labelAndName',
} as const

export type NodeDefLabelType = (typeof NodeDefLabelTypes)[keyof typeof NodeDefLabelTypes]

export const propKeys = {
  cycles: 'cycles',
  descriptions: ObjectUtils.keysProps.descriptions,
  enumerate: 'enumerate', // only for multiple entities
  autoCreateMinCountItems: 'autoCreateMinCountItems', // only for multiple entities
  key: 'key',
  autoIncrementalKey: 'autoIncrementalKey',
  labels: ObjectUtils.keysProps.labels,
  multiple: 'multiple',
  qualifier: 'qualifier',
  name: ObjectUtils.keys.name,
  readOnly: 'readOnly',
  layout: 'layout',
  // available only when readOnly is true
  hidden: 'hidden',
  shownAsHyperlink: 'shownAsHyperlink',

  // Text
  textInputType: 'textInputType',
  textTransform: 'textTransform',

  // Decimal / Integer
  maxNumberDecimalDigits: 'maxNumberDecimalDigits',
  unit: 'unit',

  // Boolean
  labelValue: 'labelValue',

  // Code
  categoryUuid: 'categoryUuid',
  parentCodeDefUuid: 'parentCodeDefUuid',

  // Taxon
  taxonomyUuid: 'taxonomyUuid',
  vernacularNameLabels: 'vernacularNameLabels',
  visibleFields: 'visibleFields',
  vernacularNameSelectionKept: 'vernacularNameSelectionKept',
  vernacularNameAlwaysIncludedIfSingle: 'vernacularNameAlwaysIncludedIfSingle',

  // File
  maxFileSize: 'maxFileSize', // max file size in MB
  fileType: 'fileType',
  geotagInformationShown: 'geotagInformationShown',
  screenCaptureInMapAllowed: 'screenCaptureInMapAllowed',

  // Time
  includeSeconds: 'includeSeconds',

  // Coordinate
  allowOnlyDeviceCoordinate: 'allowOnlyDeviceCoordinate',
  includeAccuracy: 'includeAccuracy',
  includeAltitude: 'includeAltitude',
  includeAltitudeAccuracy: 'includeAltitudeAccuracy',
  mapMarkerColor: 'mapMarkerColor',

  // Geo
  positionTracking: 'positionTracking',

  // layout elements
  headerColor: 'headerColor',

  // print
  printOrientation: 'printOrientation',
} as const

const commonAttributePropsKeys: string[] = [
  propKeys.cycles,
  propKeys.descriptions,
  propKeys.hidden,
  propKeys.key,
  propKeys.labels,
  propKeys.layout,
  propKeys.multiple,
  propKeys.name,
  propKeys.qualifier,
  propKeys.readOnly,
]

export const textInputTypes = {
  singleLine: 'singleLine',
  multiLine: 'multiLine',
} as const

export const textTransformValues = {
  [TextUtils.textTransformValues.none]: TextUtils.textTransformValues.none,
  [TextUtils.textTransformValues.lowercase]: TextUtils.textTransformValues.lowercase,
  [TextUtils.textTransformValues.uppercase]: TextUtils.textTransformValues.uppercase,
  [TextUtils.textTransformValues.capitalize]: TextUtils.textTransformValues.capitalize,
}

export const booleanLabelValues = {
  trueFalse: 'trueFalse',
  yesNo: 'yesNo',
} as const

export const coordinateAdditionalFields = {
  accuracy: 'accuracy',
  altitude: 'altitude',
  altitudeAccuracy: 'altitudeAccuracy',
} as const

export const fileTypeValues = {
  image: 'image',
  video: 'video',
  audio: 'audio',
  other: 'other',
} as const

export const keysPropsAdvanced = {
  applicable: 'applicable',
  defaultValues: 'defaultValues',
  defaultValueEvaluatedOneTime: 'defaultValueEvaluatedOneTime',
  editableIf: 'editableIf',
  excludedInClone: 'excludedInClone',
  validations: 'validations',
  visibleIf: 'visibleIf',
  formula: 'formula',

  // Analisys
  script: 'script',
  chainUuid: 'chainUuid',
  index: 'index',
  active: 'active',
  aggregateFunctions: 'aggregateFunctions',

  isBaseUnit: 'isBaseUnit',
  isSampling: 'isSampling',
  hasAreaBasedEstimated: 'hasAreaBasedEstimated',
  areaBasedEstimatedOf: 'areaBasedEstimatedOf', // uuid of area based estimated node def

  // code and taxon
  itemsFilter: 'itemsFilter',
  // file
  fileNameExpression: 'fileNameExpression',
  enumeratingItemsExpression: 'enumeratingItemsExpression',

  // reporting
  hiddenInReport: 'hiddenInReport',
} as const

const commonAttributePropsAdvancedKeys: string[] = [
  keysPropsAdvanced.applicable,
  keysPropsAdvanced.defaultValues,
  keysPropsAdvanced.defaultValueEvaluatedOneTime,
  keysPropsAdvanced.excludedInClone,
  keysPropsAdvanced.validations,
  keysPropsAdvanced.formula,
]

export const metaKeys = {
  h: 'h',
} as const

export const maxKeyAttributes = 5
const MAX_FILE_SIZE_DEFAULT = 10

export const visibleFieldsDefaultByType: Record<string, string[]> = {
  [nodeDefType.taxon]: [valuePropsTaxon.code, valuePropsTaxon.scientificName, valuePropsTaxon.vernacularName],
}

export const createAutoIncrementalKeyDefaultValues = ({
  nodeDef,
  nodeDefParent,
}: {
  nodeDef: ArenaAnyNodeDef
  nodeDefParent: ArenaNodeDefEntity
}): ArenaNodeDefExpression[] => {
  const nodeDefName = getName(nodeDef)
  const nodeDefParentName = getName(nodeDefParent)
  return [
    NodeDefExpression.createExpression({ expression: '1', applyIf: 'index($context) == 0' }),
    NodeDefExpression.createExpression({
      expression: `Math.max(parent($context).${nodeDefParentName}.${nodeDefName}) + 1`,
    }),
  ]
}

// ==== READ

export const {
  getLabels,
  getParentUuid,
  getProp,
  getProps,
  getPropsDraft,
  getPropsAndPropsDraft,
  getUuid,
  getId,
  isEqual,
  isPublished,
  isTemporary,
  dissocProp,
} = ObjectUtils

export const getType = (nodeDef: ArenaAnyNodeDef): NodeDefType => A.prop(keys.type)(nodeDef)
export const getName = (nodeDef: ArenaAnyNodeDef): string => getProp<string>(propKeys.name, '')(nodeDef)
export const getCycles = (nodeDef: ArenaAnyNodeDef): string[] => getProp<string[]>(propKeys.cycles, [])(nodeDef)

export const isKey: NodeDefPredicate = ObjectUtils.isPropTrue(propKeys.key)
export const isQualifier: NodeDefPredicate = ObjectUtils.isPropTrue(propKeys.qualifier)
export const isAutoIncrementalKey: NodeDefPredicate = ObjectUtils.isPropTrue(propKeys.autoIncrementalKey)
export const isRoot = (nodeDef: ArenaAnyNodeDef): boolean => A.isNil(getParentUuid(nodeDef))
export const isMultiple: NodeDefPredicate = ObjectUtils.isPropTrue(propKeys.multiple)
export const isSingle = (nodeDef: ArenaAnyNodeDef): boolean => !isMultiple(nodeDef)

const isType =
  <T extends ArenaAnyNodeDef>(type: NodeDefType) =>
  (nodeDef: ArenaAnyNodeDef): nodeDef is T =>
    getType(nodeDef) === type

export const isEntity = isType<ArenaNodeDefEntity>(NodeDefType.entity)
export const isSingleEntity = (nodeDef: ArenaAnyNodeDef): nodeDef is ArenaNodeDefEntity =>
  isEntity(nodeDef) && isSingle(nodeDef)
export const isMultipleEntity = (nodeDef: ArenaAnyNodeDef): nodeDef is ArenaNodeDefEntity =>
  isEntity(nodeDef) && isMultiple(nodeDef)
export const isEntityOrMultiple = (nodeDef: ArenaAnyNodeDef): boolean => isEntity(nodeDef) || isMultiple(nodeDef)

export const isAttribute = (nodeDef: ArenaAnyNodeDef): boolean => !isEntity(nodeDef)
export const isSingleAttribute = (nodeDef: ArenaAnyNodeDef): boolean => isAttribute(nodeDef) && isSingle(nodeDef)
export const isMultipleAttribute = (nodeDef: ArenaAnyNodeDef): boolean => isAttribute(nodeDef) && isMultiple(nodeDef)
export const isAttributeComposite = (nodeDef: ArenaAnyNodeDef): boolean =>
  [nodeDefType.coordinate, nodeDefType.date, nodeDefType.file, nodeDefType.taxon, nodeDefType.time].includes(
    getType(nodeDef)
  )

export const isBoolean = isType<ArenaNodeDefBoolean>(NodeDefType.boolean)
export const isCode = isType<ArenaNodeDefCode>(NodeDefType.code)
export const isCoordinate = isType<ArenaNodeDefCoordinate>(NodeDefType.coordinate)
export const isDate = isType<ArenaNodeDefDate>(NodeDefType.date)
export const isDecimal = isType<ArenaNodeDefDecimal>(NodeDefType.decimal)
export const isGeo = isType<ArenaNodeDefGeo>(NodeDefType.geo)
export const isFile = isType<ArenaNodeDefFile>(NodeDefType.file)
export const isInteger = isType<ArenaNodeDefInteger>(NodeDefType.integer)
export const isTaxon = isType<ArenaNodeDefTaxon>(NodeDefType.taxon)
export const isText = isType<ArenaNodeDefText>(NodeDefType.text)
export const isTime = isType<ArenaNodeDefTime>(NodeDefType.time)
// layout elments
export const isFormHeader = isType<ArenaNodeDefFormHeader>(NodeDefType.formHeader)

export const isReadOnly = (nodeDef: ArenaAnyNodeDef): boolean => getProp<boolean>(propKeys.readOnly, false)(nodeDef)
export const isHidden = (nodeDef: ArenaAnyNodeDef): boolean => getProp<boolean>(propKeys.hidden, false)(nodeDef)

export const getLayout = (nodeDef: ArenaAnyNodeDef): PropsObject => getProp<PropsObject>(propKeys.layout, {})(nodeDef)

export const isDeleted: NodeDefPredicate = ObjectUtils.isKeyTrue(keys.deleted)

export const getDescriptions = (nodeDef: ArenaAnyNodeDef): ArenaLabels =>
  getProp<ArenaLabels>(propKeys.descriptions, {})(nodeDef)

export const isEnumerate: NodeDefPredicate = ObjectUtils.isPropTrue(propKeys.enumerate)
export const isAutoCreateMinCountItems: NodeDefPredicate = ObjectUtils.isPropTrue(propKeys.autoCreateMinCountItems)

// boolean
export const getLabelValue = (nodeDef: ArenaAnyNodeDef): string =>
  getProp<string>(propKeys.labelValue, booleanLabelValues.trueFalse)(nodeDef)
export const isBooleanLabelYesNo = (nodeDef: ArenaAnyNodeDef): boolean =>
  isBoolean(nodeDef) && getLabelValue(nodeDef) === booleanLabelValues.yesNo
// code
export const getCategoryUuid = (nodeDef: ArenaAnyNodeDef): string | null =>
  getProp<string | null>(propKeys.categoryUuid)(nodeDef)
// coordinate
export const isAllowOnlyDeviceCoordinate: NodeDefPredicate = ObjectUtils.isPropTrue(propKeys.allowOnlyDeviceCoordinate)
export const isAccuracyIncluded: NodeDefPredicate = ObjectUtils.isPropTrue(propKeys.includeAccuracy)
export const isAltitudeIncluded: NodeDefPredicate = ObjectUtils.isPropTrue(propKeys.includeAltitude)
export const isAltitudeAccuracyIncluded: NodeDefPredicate = ObjectUtils.isPropTrue(propKeys.includeAltitudeAccuracy)
export const getMapMarkerColor = (nodeDef: ArenaAnyNodeDef): string | null =>
  getProp<string | null>(propKeys.mapMarkerColor)(nodeDef)
export const getCoordinateAdditionalFields = NodeDefs.getCoordinateAdditionalFields
// decimal / integer
export const getUnit = (nodeDef: ArenaAnyNodeDef): string => getProp<string>(propKeys.unit, '')(nodeDef)
// decimal
export const getMaxNumberDecimalDigits = (nodeDef: ArenaAnyNodeDef): number => {
  const decimalDigits = getProp(propKeys.maxNumberDecimalDigits, Number.NaN)(nodeDef)
  return A.isEmpty(decimalDigits) ? Number.NaN : Number(decimalDigits)
}
// file
export const isNumberOfFilesEnabled = isMultiple
export const getMaxFileSize = (nodeDef: ArenaAnyNodeDef): number =>
  Number(getProp(propKeys.maxFileSize, MAX_FILE_SIZE_DEFAULT)(nodeDef))
export const getFileType = (nodeDef: ArenaAnyNodeDef): string =>
  getProp<string>(propKeys.fileType, fileTypeValues.other)(nodeDef)
export const isGeotagInformationShown: NodeDefPredicate = ObjectUtils.isPropTrue(propKeys.geotagInformationShown)
export const isScreenCaptureInMapAllowed: NodeDefPredicate = ObjectUtils.isPropTrue(propKeys.screenCaptureInMapAllowed)
// geo
export const isPositionTracking: NodeDefPredicate = ObjectUtils.isPropTrue(propKeys.positionTracking)
// time
export const isSecondsIncluded: NodeDefPredicate = ObjectUtils.isPropTrue(propKeys.includeSeconds)
// taxon
export const getTaxonomyUuid = (nodeDef: ArenaAnyNodeDef): string | null =>
  getProp<string | null>(propKeys.taxonomyUuid)(nodeDef)
export const getVernacularNameLabels = (nodeDef: ArenaAnyNodeDef): ArenaLabels =>
  getProp<ArenaLabels>(propKeys.vernacularNameLabels, {})(nodeDef)
export const getVernacularNameLabel =
  (lang: string) =>
  (nodeDef: ArenaAnyNodeDef): string | undefined =>
    getVernacularNameLabels(nodeDef)[lang]
export const getVisibleFields = (nodeDef: ArenaAnyNodeDef): string[] | undefined => {
  const visibleFieldsDefault = visibleFieldsDefaultByType[getType(nodeDef)]
  return getProp<string[] | undefined>(propKeys.visibleFields, visibleFieldsDefault)(nodeDef)
}
export const isVernacularNameSelectionKept: NodeDefPredicate = ObjectUtils.isPropTrue(
  propKeys.vernacularNameSelectionKept
)
export const isVernacularNameAlwaysIncludedIfSingle: NodeDefPredicate = ObjectUtils.isPropTrue(
  propKeys.vernacularNameAlwaysIncludedIfSingle
)
// text
export const getTextInputType = (nodeDef: ArenaAnyNodeDef): string =>
  getProp<string>(propKeys.textInputType, textInputTypes.singleLine)(nodeDef)
export const getTextTransform = (nodeDef: ArenaAnyNodeDef): string =>
  getProp<string>(propKeys.textTransform, textTransformValues.none)(nodeDef)
export const getTextTransformFunction = (nodeDef: ArenaAnyNodeDef) =>
  TextUtils.transform({ transformFunction: getTextTransform(nodeDef) })

// layout elements

export const getHeaderColor = (nodeDef: ArenaAnyNodeDef): string | null =>
  getProp<string | null>(propKeys.headerColor)(nodeDef)
export const isLayoutElement = isFormHeader

/**
 * Returns the entity printable orientation, if set.
 * @param nodeDef - Entity node definition.
 * @returns 'portrait' | 'landscape' | null.
 */
export const getPrintOrientation = (nodeDef: ArenaAnyNodeDef): string | null =>
  getProp<string | null>(propKeys.printOrientation)(nodeDef)

// ==== READ meta
export const getMeta = (nodeDef: ArenaAnyNodeDef): ArenaNodeDefMeta =>
  A.propOr({}, keys.meta)(nodeDef) as ArenaNodeDefMeta
export const getMetaHierarchy = (nodeDef: ArenaAnyNodeDef): string[] => A.pathOr([], [keys.meta, metaKeys.h])(nodeDef)

// Utils
const getLabelFirstPart = (nodeDef: ArenaAnyNodeDef, lang: string, type: NodeDefLabelType): string => {
  const name = getName(nodeDef)
  if (type === NodeDefLabelTypes.name) return name

  const label = A.path([keys.props, propKeys.labels, lang], nodeDef)
  if (StringUtils.isBlank(label)) return ''
  if (type === NodeDefLabelTypes.label) return label
  if (type === NodeDefLabelTypes.labelAndName) return `${label} [${name}]`
  return ''
}

const getLabelSuffix = (nodeDef: ArenaAnyNodeDef): string => {
  if (isVirtual(nodeDef)) return ' (V)'
  if (isAnalysis(nodeDef) && isAttribute(nodeDef)) return ' (C)'
  return ''
}

export const getLabel = (
  nodeDef: ArenaAnyNodeDef,
  lang: string,
  type: NodeDefLabelType = NodeDefLabelTypes.label,
  defaultToName = true
): string => {
  let firstPart = getLabelFirstPart(nodeDef, lang, type)
  // default to name
  if (StringUtils.isBlank(firstPart) && defaultToName) {
    firstPart = getName(nodeDef)
  }
  return firstPart + getLabelSuffix(nodeDef)
}
export const getLabelWithType = ({
  nodeDef,
  lang,
  type,
}: {
  nodeDef: ArenaAnyNodeDef
  lang: string
  type?: NodeDefLabelType
}): string => getLabel(nodeDef, lang, type)

export const getDescription =
  (lang: string) =>
  (nodeDef: ArenaAnyNodeDef): string =>
    A.propOr('', lang, getDescriptions(nodeDef)) as string

export const getCycleFirst = (nodeDef: ArenaAnyNodeDef): string | undefined => A.head(getCycles(nodeDef))

export const isInCycle =
  (cycle: string) =>
  (nodeDef: ArenaAnyNodeDef): boolean =>
    getCycles(nodeDef).includes(cycle)

export const isAncestorOf =
  (nodeDefDescendant: ArenaAnyNodeDef) =>
  (nodeDef: ArenaAnyNodeDef): boolean =>
    A.startsWith([...getMetaHierarchy(nodeDef), getUuid(nodeDef)], getMetaHierarchy(nodeDefDescendant))

export const isDescendantOf =
  (nodeDefAncestor: ArenaAnyNodeDef) =>
  (nodeDef: ArenaAnyNodeDef): boolean => {
    const hAncestor = [...getMetaHierarchy(nodeDefAncestor), getUuid(nodeDefAncestor)]
    return A.startsWith(hAncestor, getMetaHierarchy(nodeDef))
  }

// Advanced props

export const getPropsAdvanced = (nodeDef: ArenaAnyNodeDef): ArenaNodeDefPropsAdvanced & PropsObject =>
  A.propOr({}, keys.propsAdvanced)(nodeDef) as PropsObject
export const getPropsAdvancedDraft = (nodeDef: ArenaAnyNodeDef): ArenaNodeDefPropsAdvanced & PropsObject =>
  A.propOr({}, keys.propsAdvancedDraft)(nodeDef) as PropsObject

export const getPropAdvanced =
  <T = any>(prop: string, defaultTo: T = null) =>
  (nodeDef: ArenaAnyNodeDef): T =>
    A.pathOr(defaultTo, prop.split('.'))(getPropsAdvanced(nodeDef))

export const getPropAdvancedDraft =
  <T = any>(prop: string, defaultTo: T = null) =>
  (nodeDef: ArenaAnyNodeDef): T =>
    A.pathOr(defaultTo, prop.split('.'))(getPropsAdvancedDraft(nodeDef))

export const getPropOrDraftAdvanced =
  <T = any>(prop: string, defaultTo: T = null) =>
  (nodeDef: ArenaAnyNodeDef): T =>
    getPropAdvancedDraft(prop, getPropAdvanced(prop, defaultTo)(nodeDef))(nodeDef)

export const getAllPropsAndAllPropsDraft =
  ({ backup = false }: { backup?: boolean }) =>
  (nodeDef: ArenaAnyNodeDef) => {
    const { props, propsDraft } = ObjectUtils.getPropsAndPropsDraft({ backup })(nodeDef as PropsObject)
    const propsAdvanced = getPropsAdvanced(nodeDef)
    const propsAdvancedDraft = getPropsAdvancedDraft(nodeDef)
    return {
      props,
      propsDraft,
      propsAdvanced: backup ? propsAdvanced : {},
      propsAdvancedDraft: backup ? propsAdvancedDraft : { ...propsAdvanced, ...propsAdvancedDraft },
    }
  }

const isKeyStrictlyTrue =
  (key: string) =>
  (nodeDef: ArenaAnyNodeDef): boolean =>
    A.prop(key, nodeDef) === true

export const hasAdvancedPropsDraft = isKeyStrictlyTrue(keys.draftAdvanced)
export const hasAdvancedPropsApplicableDraft = isKeyStrictlyTrue(keys.draftAdvancedApplicable)
export const hasAdvancedPropsDefaultValuesDraft = isKeyStrictlyTrue(keys.draftAdvancedDefaultValues)
export const hasAdvancedPropsFileNameExpressionDraft = isKeyStrictlyTrue(keys.draftAdvancedFileNameExpression)
export const hasAdvancedPropsValidationsDraft = isKeyStrictlyTrue(keys.draftAdvancedValidations)
// Unlike the flags above (set on the node def row by the server whenever the corresponding key is
// present in propsAdvancedDraft, for a fixed set of keys it tracks), enumeratingItemsExpression and
// itemsFilter are not tracked server-side, so they're checked here instead, directly against
// propsAdvancedDraft. This only works if the node def was fetched with backup: true (see
// fetchSurveyAndNodeDefsBySurveyId) - a plain draft fetch merges propsAdvancedDraft into propsAdvanced
// and discards it, at which point these would always read as unchanged.
export const hasAdvancedPropsEnumeratingItemsExpressionDraft = (nodeDef: ArenaAnyNodeDef): boolean =>
  Boolean(getPropAdvancedDraft(keysPropsAdvanced.enumeratingItemsExpression)(nodeDef))
export const hasAdvancedPropsItemsFilterDraft = (nodeDef: ArenaAnyNodeDef): boolean =>
  Boolean(getPropAdvancedDraft(keysPropsAdvanced.itemsFilter)(nodeDef))
// Node defs whose value (or, for auto-enumerated entities, their enumerated child nodes) can be
// recalculated on publish - see RecordCheckJob. Requires the node def to have been fetched with
// backup: true (see the two functions above).
// True if the "required if" condition in the draft advanced props differs from the published one.
// Like the checks below, it works only if the node def was fetched with backup: true.
export const hasRequiredIfDraftChanged = (nodeDef: ArenaAnyNodeDef): boolean => {
  if (!hasAdvancedPropsValidationsDraft(nodeDef)) return false
  const requiredIfPath = `${keysPropsAdvanced.validations}.${NodeDefValidations.keys.requiredIf}`
  return !A.equals(getPropAdvancedDraft(requiredIfPath, [])(nodeDef), getPropAdvanced(requiredIfPath, [])(nodeDef))
}

export const hasValueAffectingAdvancedPropsDraft = (nodeDef: ArenaAnyNodeDef): boolean =>
  hasAdvancedPropsApplicableDraft(nodeDef) ||
  hasAdvancedPropsDefaultValuesDraft(nodeDef) ||
  hasAdvancedPropsFileNameExpressionDraft(nodeDef) ||
  hasAdvancedPropsEnumeratingItemsExpressionDraft(nodeDef) ||
  hasAdvancedPropsItemsFilterDraft(nodeDef)
const isPropAdvanced = (key: string): boolean => Object.keys(keysPropsAdvanced).includes(key)

const getExpressionsPropAdvanced =
  (prop: string) =>
  (nodeDef: ArenaAnyNodeDef): ArenaNodeDefExpression[] =>
    getPropAdvanced<ArenaNodeDefExpression[]>(prop, [])(nodeDef)

export const getDefaultValues = getExpressionsPropAdvanced(keysPropsAdvanced.defaultValues)
export const hasDefaultValues = (nodeDef: ArenaAnyNodeDef): boolean => !A.isEmpty(getDefaultValues(nodeDef))
export const isDefaultValueEvaluatedOneTime = (nodeDef: ArenaAnyNodeDef): boolean =>
  getPropAdvanced<boolean>(keysPropsAdvanced.defaultValueEvaluatedOneTime, false)(nodeDef)

export const getEditableIf = getExpressionsPropAdvanced(keysPropsAdvanced.editableIf)
export const isAlwaysEditable = (nodeDef: ArenaAnyNodeDef): boolean => A.isEmpty(getEditableIf(nodeDef))
export const getVisibleIf = getExpressionsPropAdvanced(keysPropsAdvanced.visibleIf)
export const isAlwaysVisible = (nodeDef: ArenaAnyNodeDef): boolean => A.isEmpty(getVisibleIf(nodeDef))

export const getValidations = (nodeDef: ArenaAnyNodeDef): ArenaNodeDefValidations =>
  getPropAdvanced<ArenaNodeDefValidations>(keysPropsAdvanced.validations, {})(nodeDef)
export const getValidationExpressions = (nodeDef: ArenaAnyNodeDef): ArenaNodeDefExpression[] =>
  NodeDefValidations.getExpressions(getValidations(nodeDef))
export const hasValidationsDefined = (nodeDef: ArenaAnyNodeDef): boolean => {
  const validations = getValidations(nodeDef)
  return (
    NodeDefValidations.isRequired(validations) ||
    NodeDefValidations.isRequiredIfDefined(validations) ||
    NodeDefValidations.isUnique(validations) ||
    !A.isEmpty(NodeDefValidations.getMinCount(validations)) ||
    !A.isEmpty(NodeDefValidations.getMaxCount(validations)) ||
    !A.isEmpty(NodeDefValidations.getExpressions(validations))
  )
}

export const getApplicable = getExpressionsPropAdvanced(keysPropsAdvanced.applicable)

// Flattens an array of NodeDefExpression objects (as stored under defaultValues/applicable/
// validations.expressions/editableIf/visibleIf - each { expression, applyIf, ... }) into a plain array
// of expression strings (both the expression itself and its applyIf, when present).
const _expressionStringsFromNodeDefExpressions = (nodeDefExpressions: ArenaNodeDefExpression[]): string[] =>
  nodeDefExpressions.reduce((acc: string[], nodeDefExpression) => {
    ArrayUtils.addIfNotEmpty(NodeDefExpression.getExpression(nodeDefExpression))(acc)
    ArrayUtils.addIfNotEmpty(NodeDefExpression.getApplyIf(nodeDefExpression))(acc)
    return acc
  }, [])

export const getAllExpressions = (nodeDef: ArenaAnyNodeDef): string[] => {
  const nodeDefExpressions = [
    ...getDefaultValues(nodeDef),
    ...getValidationExpressions(nodeDef),
    ...getApplicable(nodeDef),
    ...getEditableIf(nodeDef),
    ...getVisibleIf(nodeDef),
  ]
  const expressions = _expressionStringsFromNodeDefExpressions(nodeDefExpressions)
  ArrayUtils.addIfNotEmpty(getItemsFilter(nodeDef))(expressions)
  ArrayUtils.addIfNotEmpty(getFileNameExpression(nodeDef))(expressions)
  ArrayUtils.addIfNotEmpty(getEnumeratingItemsExpression(nodeDef))(expressions)
  return expressions
}

// Value-affecting-only subset of getAllExpressions: applicable, default values, file name expression,
// enumerating items expression, items filter - the exact same boundary hasValueAffectingAdvancedPropsDraft
// draws between props that can change a node's stored value and ones that don't (e.g. validations,
// editableIf, visibleIf are excluded). Used to find node defs whose value needs recalculating when
// something they read (e.g. a category/taxonomy extra prop) changes - see
// referencesCategoryExtraProp/referencesTaxonomyExtraProp below.
export const getValueAffectingExpressions = (nodeDef: ArenaAnyNodeDef): string[] => {
  const expressions = _expressionStringsFromNodeDefExpressions([
    ...getDefaultValues(nodeDef),
    ...getApplicable(nodeDef),
  ])
  ArrayUtils.addIfNotEmpty(getItemsFilter(nodeDef))(expressions)
  ArrayUtils.addIfNotEmpty(getFileNameExpression(nodeDef))(expressions)
  ArrayUtils.addIfNotEmpty(getEnumeratingItemsExpression(nodeDef))(expressions)
  return expressions
}

// Plain expression strings from the node def's validation expressions only (see
// getValidationExpressions) - used by referencesCategoryExtraPropInValidations/
// referencesTaxonomyExtraPropInValidations below.
const getValidationOnlyExpressionStrings = (nodeDef: ArenaAnyNodeDef): string[] =>
  _expressionStringsFromNodeDefExpressions(getValidationExpressions(nodeDef))

const userDependentFunctionsRegExp = new RegExp(String.raw`\b(${userDependentFunctionNames.join('|')})\s*\(`)

// Returns true if any of the node def's expressions references a function whose
// result depends on the currently logged in user (e.g. userProp).
export const hasUserDependentExpressions = (nodeDef: ArenaAnyNodeDef): boolean =>
  getAllExpressions(nodeDef).some((expression) => userDependentFunctionsRegExp.test(expression))

type ExtraPropChangeParams = {
  changedPropNames: Set<string>
}

// True if any of the given expressions calls categoryItemProp(entityName, propName, ...) /
// taxonProp(entityName, propName, ...) - matched by function name - referencing the given
// category/taxonomy name, for one of the given (changed) extra prop names. A non-literal propName
// argument (identifier, nested call...) can't be resolved statically, so it's conservatively treated
// as a potential match rather than ruled out.
const _referencesExtraPropChange = ({
  expressions,
  functionName,
  entityName,
  changedPropNames,
}: ExtraPropChangeParams & { expressions: string[]; functionName: string; entityName: string }): boolean =>
  expressions.some((expression) =>
    extractCallFirstTwoArgs(expression, functionName).some(
      ([entityNameArg, propNameArg]) =>
        entityNameArg === entityName && (propNameArg === null || changedPropNames.has(propNameArg))
    )
  )

// True if nodeDef's value could be affected by a change to one of `changedPropNames` on the category
// named `categoryName` - i.e. one of its value-affecting expressions calls
// categoryItemProp(categoryName, propName, ...) with propName in changedPropNames (or unresolvable).
export const referencesCategoryExtraProp =
  ({ categoryName, changedPropNames }: ExtraPropChangeParams & { categoryName: string }) =>
  (nodeDef: ArenaAnyNodeDef): boolean =>
    _referencesExtraPropChange({
      expressions: getValueAffectingExpressions(nodeDef),
      functionName: functionNames.categoryItemProp,
      entityName: categoryName,
      changedPropNames,
    })

// Same as referencesCategoryExtraProp, for taxonProp(taxonomyName, propName, ...) calls.
export const referencesTaxonomyExtraProp =
  ({ taxonomyName, changedPropNames }: ExtraPropChangeParams & { taxonomyName: string }) =>
  (nodeDef: ArenaAnyNodeDef): boolean =>
    _referencesExtraPropChange({
      expressions: getValueAffectingExpressions(nodeDef),
      functionName: functionNames.taxonProp,
      entityName: taxonomyName,
      changedPropNames,
    })

// Same as referencesCategoryExtraProp/referencesTaxonomyExtraProp, but scanning only validation
// expressions - used to trigger re-validation (not value recalculation) of node defs that only
// reference a changed extra prop from a validation expression.
export const referencesCategoryExtraPropInValidations =
  ({ categoryName, changedPropNames }: ExtraPropChangeParams & { categoryName: string }) =>
  (nodeDef: ArenaAnyNodeDef): boolean =>
    _referencesExtraPropChange({
      expressions: getValidationOnlyExpressionStrings(nodeDef),
      functionName: functionNames.categoryItemProp,
      entityName: categoryName,
      changedPropNames,
    })

export const referencesTaxonomyExtraPropInValidations =
  ({ taxonomyName, changedPropNames }: ExtraPropChangeParams & { taxonomyName: string }) =>
  (nodeDef: ArenaAnyNodeDef): boolean =>
    _referencesExtraPropChange({
      expressions: getValidationOnlyExpressionStrings(nodeDef),
      functionName: functionNames.taxonProp,
      entityName: taxonomyName,
      changedPropNames,
    })

export const isExcludedInClone = (nodeDef: ArenaAnyNodeDef): boolean =>
  getPropAdvanced<boolean>(keysPropsAdvanced.excludedInClone, false)(nodeDef)

// code and taxon
export const getItemsFilter = (nodeDef: ArenaAnyNodeDef): string =>
  getPropAdvanced<string>(keysPropsAdvanced.itemsFilter, '')(nodeDef)
// file
export const getFileNameExpression = (nodeDef: ArenaAnyNodeDef): string =>
  getPropAdvanced<string>(keysPropsAdvanced.fileNameExpression, '')(nodeDef)
export const getEnumeratingItemsExpression = (nodeDef: ArenaAnyNodeDef): string =>
  getPropAdvanced<string>(keysPropsAdvanced.enumeratingItemsExpression, '')(nodeDef)

// Advanced props - Analysis
export const getFormula = getExpressionsPropAdvanced(keysPropsAdvanced.formula)

export const getParentCodeDefUuid = (nodeDef: ArenaAnyNodeDef): string | null =>
  getProp<string | null>(propKeys.parentCodeDefUuid)(nodeDef)

export const getChainUuid = (nodeDef: ArenaAnyNodeDef): string | null =>
  getPropOrDraftAdvanced<string | null>(keysPropsAdvanced.chainUuid, null)(nodeDef)

export const getChainIndex = (nodeDef: ArenaAnyNodeDef): number =>
  getPropOrDraftAdvanced<number>(keysPropsAdvanced.index, 0)(nodeDef)

export const isActive = (nodeDef: ArenaAnyNodeDef): boolean =>
  getPropAdvanced<boolean>(keysPropsAdvanced.active, false)(nodeDef)
export const getScript = (nodeDef: ArenaAnyNodeDef): string =>
  getPropOrDraftAdvanced<string>(keysPropsAdvanced.script, '')(nodeDef)

export const getAggregateFunctions = (nodeDef: ArenaAnyNodeDef): Record<string, any> =>
  getPropOrDraftAdvanced<Record<string, any>>(keysPropsAdvanced.aggregateFunctions, {})(nodeDef)
export const getAggregateFunctionByUuid =
  (uuid: string) =>
  (nodeDef: ArenaAnyNodeDef): any =>
    A.propOr(null, uuid)(getAggregateFunctions(nodeDef))

// READ Analysis
export const isAnalysis: NodeDefPredicate = ObjectUtils.isKeyTrue(keys.analysis)
export const isVirtual: NodeDefPredicate = ObjectUtils.isKeyTrue(keys.virtual)
export const isReadOnlyOrAnalysis = (nodeDef: ArenaAnyNodeDef): boolean => isReadOnly(nodeDef) || isAnalysis(nodeDef)

const isPropOrDraftAdvancedTrue =
  (prop: string) =>
  (nodeDef: ArenaAnyNodeDef): boolean =>
    Boolean(getPropOrDraftAdvanced(prop, false)(nodeDef))

export const isBaseUnit = isPropOrDraftAdvancedTrue(keysPropsAdvanced.isBaseUnit)
export const isSampling = isPropOrDraftAdvancedTrue(keysPropsAdvanced.isSampling)
export const hasAreaBasedEstimated = isPropOrDraftAdvancedTrue(keysPropsAdvanced.hasAreaBasedEstimated)
export const getAreaBasedEstimatedOf = (nodeDef: ArenaAnyNodeDef): string | null =>
  getPropOrDraftAdvanced<string | null>(keysPropsAdvanced.areaBasedEstimatedOf, null)(nodeDef)
export const isAreaBasedEstimatedOf = (nodeDef: ArenaAnyNodeDef): boolean => Boolean(getAreaBasedEstimatedOf(nodeDef))

// Reporting
export const isHiddenInReport = (nodeDef: ArenaAnyNodeDef): boolean =>
  getPropAdvanced<boolean>(keysPropsAdvanced.hiddenInReport, false)(nodeDef)

// ==== CREATE

export const newNodeDef = (
  nodeDefParent: ArenaNodeDefEntity | null,
  type: NodeDefType,
  cycles: string[],
  props: PropsObject = {},
  propsAdvanced: PropsObject = {},
  analysis = false,
  virtual = false
): ArenaAnyNodeDef =>
  ({
    [keys.uuid]: uuidv4(),
    [keys.parentUuid]: getUuid(nodeDefParent),
    [keys.type]: type,
    [keys.props]: {
      ...props,
      [propKeys.cycles]: cycles,
    },
    [keys.propsAdvanced]: {
      ...propsAdvanced,
    },
    [keys.meta]: {
      [metaKeys.h]: nodeDefParent ? [...getMetaHierarchy(nodeDefParent), getUuid(nodeDefParent)] : [],
    },
    [keys.analysis]: analysis,
    [keys.virtual]: virtual,
    [keys.temporary]: true,
  }) as ArenaAnyNodeDef

// ==== UPDATE

export const assocDeleted = A.assoc(keys.deleted)

export const assocParentUuid = A.assoc(keys.parentUuid)
export const assocMetaHierarchy = A.assocPath([keys.meta, metaKeys.h])
export const mergeProps =
  (props: PropsObject): NodeDefUpdater =>
  (nodeDef) =>
    ObjectUtils.mergeProps(props)(nodeDef) as ArenaAnyNodeDef
const assocPropsAdvanced = A.assoc(keys.propsAdvanced)
export const mergePropsAdvanced =
  (propsAdvanced: PropsObject): NodeDefUpdater =>
  (nodeDef) =>
    assocPropsAdvanced(A.mergeLeft(propsAdvanced)(getPropsAdvanced(nodeDef)), nodeDef)
export const assocDefaultValues = (defaultValues: ArenaNodeDefExpression[]): NodeDefUpdater =>
  mergePropsAdvanced({ [keysPropsAdvanced.defaultValues]: defaultValues })
export const assocDefaultValueEvaluatedOnlyOneTime = (evaluatedOnlyOneTime: boolean): NodeDefUpdater =>
  mergePropsAdvanced({ [keysPropsAdvanced.defaultValueEvaluatedOneTime]: evaluatedOnlyOneTime })
export const assocValidations = (validations: ArenaNodeDefValidations): NodeDefUpdater =>
  mergePropsAdvanced({ [keysPropsAdvanced.validations]: validations })
export const dissocTemporary: NodeDefUpdater = A.dissoc(keys.temporary)
export const assocProp = ({ key, value }: { key: string; value: unknown }): NodeDefUpdater =>
  isPropAdvanced(key) ? mergePropsAdvanced({ [key]: value }) : mergeProps({ [key]: value })
export const assocCycles = (cycles: string[]): NodeDefUpdater => assocProp({ key: propKeys.cycles, value: cycles })
export const assocExcludedInClone = (value: boolean): NodeDefUpdater =>
  assocProp({ key: keysPropsAdvanced.excludedInClone, value })
export const assocLabels = (labels: ArenaLabels): NodeDefUpdater => assocProp({ key: propKeys.labels, value: labels })
export const assocLabel =
  ({ label, lang }: { label: string; lang: string }): NodeDefUpdater =>
  (nodeDef) =>
    assocLabels({ ...getLabels(nodeDef), [lang]: label })(nodeDef)

export const assocDescriptions = (descriptions: ArenaLabels): NodeDefUpdater =>
  assocProp({ key: propKeys.descriptions, value: descriptions })
export const assocHidden = (hidden: boolean): NodeDefUpdater => assocProp({ key: propKeys.hidden, value: hidden })

export const dissocEnumerate: NodeDefUpdater = ObjectUtils.dissocProp(propKeys.enumerate)
export const cloneIntoEntityDef =
  ({
    nodeDefParent,
    clonedNodeDefName,
    ignoreDefaultValues = true,
    ignoreApplicability = true,
    ignoreValidations = true,
  }: {
    nodeDefParent: ArenaNodeDefEntity
    clonedNodeDefName: string
    ignoreDefaultValues?: boolean
    ignoreApplicability?: boolean
    ignoreValidations?: boolean
  }): NodeDefUpdater =>
  (nodeDef) => {
    const propsCloned: PropsObject = ObjectUtils.clone(getProps(nodeDef))
    propsCloned[propKeys.name] = clonedNodeDefName

    const propsAdvancedCloned: PropsObject = ObjectUtils.clone(getPropsAdvanced(nodeDef))
    if (ignoreDefaultValues) {
      delete propsCloned[propKeys.readOnly]
      delete propsAdvancedCloned[keysPropsAdvanced.defaultValues]
      delete propsAdvancedCloned[keysPropsAdvanced.defaultValueEvaluatedOneTime]
      delete propsAdvancedCloned[keysPropsAdvanced.fileNameExpression]
      delete propsCloned[propKeys.autoIncrementalKey]
    }
    if (ignoreApplicability) {
      delete propsAdvancedCloned[keysPropsAdvanced.applicable]
    }
    if (ignoreValidations) {
      delete propsAdvancedCloned[keysPropsAdvanced.validations]
    }
    return newNodeDef(
      nodeDefParent,
      getType(nodeDef),
      [...getCycles(nodeDef)],
      propsCloned,
      propsAdvancedCloned,
      isAnalysis(nodeDef)
    )
  }

export const changeParentEntity =
  ({ targetParentNodeDef }: { targetParentNodeDef: ArenaNodeDefEntity }): NodeDefUpdater =>
  (nodeDef) => {
    const targetParentNodeDefUuid = getUuid(targetParentNodeDef)
    return {
      ...nodeDef,
      [keys.parentUuid]: targetParentNodeDefUuid,
      [keys.meta]: {
        ...getMeta(nodeDef),
        [metaKeys.h]: [...getMetaHierarchy(targetParentNodeDef), targetParentNodeDefUuid],
      },
    }
  }

// published attributes have data: they can only be converted to a type that keeps it (integer to decimal)
export const getConvertibleTypes = (nodeDef: ArenaAnyNodeDef): NodeDefType[] => {
  if (!isAttribute(nodeDef)) return []
  if (isPublished(nodeDef)) return isInteger(nodeDef) ? [nodeDefType.decimal] : []
  return Object.values(nodeDefType).filter((type) => ![nodeDefType.entity, getType(nodeDef)].includes(type))
}

export const convertToType =
  ({ toType }: { toType: NodeDefType }): NodeDefUpdater =>
  (nodeDef) => {
    const propsUpdated: PropsObject = A.pick(commonAttributePropsKeys)(getProps(nodeDef))
    const propsAdvancedToKeep = isAutoIncrementalKey(nodeDef)
      ? commonAttributePropsAdvancedKeys.filter((prop) => prop !== keysPropsAdvanced.defaultValues)
      : commonAttributePropsAdvancedKeys
    const propsAdvancedUpdated = A.pick(propsAdvancedToKeep)(getPropsAdvanced(nodeDef))

    const layout = getLayout(nodeDef)
    const layoutUpdated = Object.entries(layout).reduce((acc: PropsObject, [cycleKey, cycleLayout]) => {
      acc[cycleKey] = A.pick(NodeDefLayout.commonAttributeKeys)(cycleLayout)
      return acc
    }, {})
    propsUpdated[propKeys.layout] = layoutUpdated

    return {
      ...nodeDef,
      [keys.type]: toType,
      [keys.props]: propsUpdated,
      [keys.propsAdvanced]: propsAdvancedUpdated,
    } as ArenaAnyNodeDef
  }

// layout
export const assocLayout = (layout: PropsObject): NodeDefUpdater => setProp(propKeys.layout, layout)

export const updateLayout =
  (updateFn: (layout: PropsObject) => PropsObject): NodeDefUpdater =>
  (nodeDef) => {
    const layout = getLayout(nodeDef)
    const layoutUpdated = updateFn(layout)
    return assocLayout(layoutUpdated)(nodeDef)
  }

export const updateLayoutProp = ({ cycle, prop, value }: { cycle: string; prop: string; value: unknown }) =>
  updateLayout(NodeDefLayout.assocLayoutProp(cycle, prop, value))

export const dissocLayoutProp = ({ cycle, prop }: { cycle: string; prop: string }) =>
  updateLayout(NodeDefLayout.dissocLayoutProp(cycle, prop))

export const copyLayout =
  ({ cycleFrom, cyclesTo }: { cycleFrom: string; cyclesTo: string[] }): NodeDefUpdater =>
  (nodeDef) =>
    updateLayout((layout) => {
      const layoutCycle = NodeDefLayout.getLayoutCycle(cycleFrom)(nodeDef)
      return cyclesTo
        .filter((cycleKey) => cycleKey !== cycleFrom)
        .reduce((layoutAcc, cycleKey) => NodeDefLayout.assocLayoutCycle(cycleKey, layoutCycle)(layoutAcc), layout)
    })(nodeDef)

/**
 * Keeps only cycleToKeep information and moves it to cycleTarget (mutates the specified nodeDef).
 * @param params - The function parameters.
 * @param params.cycleToKeep - Id of source cycle to keep.
 * @param params.cycleTarget - Id of target cycle.
 * @returns The function that updates (and returns) the specified nodeDef.
 */
export const keepOnlyOneCycle =
  ({ cycleToKeep, cycleTarget }: { cycleToKeep: string; cycleTarget: string }): NodeDefUpdater =>
  (nodeDef) => {
    const nodeDefProps: PropsObject = nodeDef[keys.props]
    nodeDefProps[propKeys.cycles] = [cycleTarget]
    const layoutForCycle = nodeDefProps[propKeys.layout]?.[cycleToKeep]

    if (Objects.isEmpty(layoutForCycle)) {
      delete nodeDefProps[propKeys.layout]
    } else {
      nodeDefProps[propKeys.layout] = { [cycleTarget]: layoutForCycle }
    }
    return nodeDef
  }

// ==== UTILS
export const canNodeDefBeMultiple = (nodeDef: ArenaAnyNodeDef): boolean =>
  // Entity def but not root
  (isEntity(nodeDef) && !isRoot(nodeDef)) ||
  // Attribute def but not layout element and not analysis
  (!isLayoutElement(nodeDef) &&
    !isAnalysis(nodeDef) &&
    A.includes(getType(nodeDef), [
      nodeDefType.decimal,
      nodeDefType.code,
      nodeDefType.file,
      nodeDefType.integer,
      nodeDefType.taxon,
      nodeDefType.text,
    ]))

export const canNodeDefTypeBeKey = (type: NodeDefType): boolean =>
  A.includes(type, [
    nodeDefType.date,
    nodeDefType.decimal,
    nodeDefType.code,
    nodeDefType.integer,
    nodeDefType.taxon,
    nodeDefType.text,
    nodeDefType.time,
  ])

export const canNodeDefBeKey = (nodeDef: ArenaAnyNodeDef): boolean =>
  !isLayoutElement(nodeDef) && !isAnalysis(nodeDef) && canNodeDefTypeBeKey(getType(nodeDef))

export const canHaveDefaultValue = (nodeDef: ArenaAnyNodeDef): boolean =>
  isSingleAttribute(nodeDef) &&
  A.includes(getType(nodeDef), [
    nodeDefType.boolean,
    nodeDefType.code,
    nodeDefType.coordinate,
    nodeDefType.date,
    nodeDefType.decimal,
    nodeDefType.geo,
    nodeDefType.integer,
    nodeDefType.taxon,
    nodeDefType.text,
    nodeDefType.time,
  ])

export const belongsToAllCycles =
  (cycles: string[]) =>
  (nodeDef: ArenaAnyNodeDef): boolean =>
    A.isEmpty(A.difference(cycles, getCycles(nodeDef)))
export const canBeExcludedInClone = (nodeDef: ArenaAnyNodeDef): boolean => !isRoot(nodeDef) && !isKey(nodeDef)

const isEntityAndNotRoot = (nodeDef: ArenaAnyNodeDef): boolean => isEntity(nodeDef) && !isRoot(nodeDef)
export const isDisplayAsEnabled = isEntityAndNotRoot
export const isDisplayInEnabled = isEntityAndNotRoot

export const canMultipleAttributeBeAggregated = (nodeDef: ArenaAnyNodeDef): boolean =>
  [nodeDefType.code, nodeDefType.decimal, nodeDefType.integer, nodeDefType.text].includes(getType(nodeDef))

export const canNameBeEdited = (nodeDef: ArenaAnyNodeDef): boolean => !isSampling(nodeDef)
export const canBeHidden = (nodeDef: ArenaAnyNodeDef): boolean => isReadOnly(nodeDef)
export const canBeShownAsHyperlinkOrMarkdown = (nodeDef: ArenaAnyNodeDef): boolean =>
  isText(nodeDef) && isReadOnly(nodeDef)
export const canBeHiddenInMobile = (nodeDef: ArenaAnyNodeDef): boolean =>
  !isKey(nodeDef) &&
  !NodeDefValidations.isRequired(getValidations(nodeDef)) &&
  !NodeDefValidations.isRequiredIfDefined(getValidations(nodeDef))

export const canIncludeInMultipleEntitySummary =
  (cycle: string) =>
  (nodeDef: ArenaAnyNodeDef): boolean =>
    isAttribute(nodeDef) &&
    !isLayoutElement(nodeDef) &&
    !isKey(nodeDef) &&
    !isMultiple(nodeDef) &&
    !isFile(nodeDef) &&
    !isGeo(nodeDef) &&
    !isAnalysis(nodeDef) &&
    NodeDefLayout.canIncludeInMultipleEntitySummary(cycle)(nodeDef)

export const canIncludeInPreviousCycleLink =
  (cycle: string) =>
  (nodeDef: ArenaAnyNodeDef): boolean =>
    !isKey(nodeDef) && NodeDefLayout.canIncludeInPreviousCycleLink(cycle)(nodeDef)

export const canHaveMobileProps =
  (cycle: string) =>
  (nodeDef: ArenaAnyNodeDef): boolean =>
    canBeHiddenInMobile(nodeDef) || canIncludeInPreviousCycleLink(cycle)(nodeDef)

export const canHaveAutoIncrementalKey = ({
  nodeDef,
  nodeDefParent,
}: {
  nodeDef: ArenaAnyNodeDef
  nodeDefParent: ArenaNodeDefEntity
}): boolean => {
  if (!isKey(nodeDef) || !isInteger(nodeDef)) return false

  const defaultValues = getDefaultValues(nodeDef)
  if (defaultValues.length === 0) return true

  const autoIncrementalDefaultValues = createAutoIncrementalKeyDefaultValues({ nodeDef, nodeDefParent })
  return (
    defaultValues.length === autoIncrementalDefaultValues.length &&
    autoIncrementalDefaultValues.every((defaultValue, index) =>
      NodeDefExpression.isSimilarTo(defaultValue)(defaultValues[index])
    )
  )
}

export const canShowGeotagInformation = (nodeDef: ArenaAnyNodeDef): boolean =>
  getFileType(nodeDef) === fileTypeValues.image

export const canAllowScreenCaptureInMap = (nodeDef: ArenaAnyNodeDef): boolean =>
  isFile(nodeDef) && getFileType(nodeDef) === fileTypeValues.image

// Arena Mobile records the track only in single geo attributes
export const canBePositionTracking = (nodeDef: ArenaAnyNodeDef): boolean => isGeo(nodeDef) && isSingle(nodeDef)

export const canBeHiddenInReport = (nodeDef: ArenaAnyNodeDef): boolean =>
  [NodeDefType.boolean, NodeDefType.code, NodeDefType.taxon].includes(getType(nodeDef))

export const canHaveAutoCreateMinCountItems = (nodeDef: ArenaAnyNodeDef): boolean =>
  isMultipleEntity(nodeDef) && !isEnumerate(nodeDef)

type NotApplicablePropClearer = { isToClear: NodeDefPredicate; clear: NodeDefUpdater }

// props (or layout props) to clear when not applicable to the node def, checked in order on the updated node def
const notApplicablePropClearers = (cycle: string): NotApplicablePropClearer[] => [
  {
    isToClear: (nodeDef) => !canHaveAutoCreateMinCountItems(nodeDef) && isAutoCreateMinCountItems(nodeDef),
    clear: assocProp({ key: propKeys.autoCreateMinCountItems, value: false }),
  },
  {
    isToClear: (nodeDef) => !canBeHidden(nodeDef) && isHidden(nodeDef),
    clear: assocHidden(false),
  },
  {
    isToClear: (nodeDef) => !canBeHiddenInMobile(nodeDef) && NodeDefLayout.isHiddenInMobile(cycle)(nodeDef),
    clear: dissocLayoutProp({ cycle, prop: NodeDefLayout.keys.hiddenInMobile }),
  },
  {
    // text attribute: render type hyperlink or Markdown
    isToClear: (nodeDef) =>
      isText(nodeDef) &&
      !canBeShownAsHyperlinkOrMarkdown(nodeDef) &&
      NodeDefLayout.getRenderType(cycle)(nodeDef) !== NodeDefLayout.textRenderType.text,
    clear: dissocLayoutProp({ cycle, prop: NodeDefLayout.keys.renderType }),
  },
  {
    isToClear: (nodeDef) =>
      !canIncludeInMultipleEntitySummary(cycle)(nodeDef) &&
      NodeDefLayout.isIncludedInMultipleEntitySummary(cycle)(nodeDef),
    clear: dissocLayoutProp({ cycle, prop: NodeDefLayout.keys.includedInMultipleEntitySummary }),
  },
  {
    isToClear: (nodeDef) =>
      !canIncludeInPreviousCycleLink(cycle)(nodeDef) && NodeDefLayout.isIncludedInPreviousCycleLink(cycle)(nodeDef),
    clear: dissocLayoutProp({ cycle, prop: NodeDefLayout.keys.includedInPreviousCycleLink }),
  },
  {
    isToClear: (nodeDef) => !canBeExcludedInClone(nodeDef) && isExcludedInClone(nodeDef),
    clear: assocExcludedInClone(false),
  },
  {
    isToClear: (nodeDef) => !canShowGeotagInformation(nodeDef) && isGeotagInformationShown(nodeDef),
    clear: setProp(propKeys.geotagInformationShown, false),
  },
  {
    isToClear: (nodeDef) => !canAllowScreenCaptureInMap(nodeDef) && isScreenCaptureInMapAllowed(nodeDef),
    clear: setProp(propKeys.screenCaptureInMapAllowed, false),
  },
  {
    isToClear: (nodeDef) => !canBePositionTracking(nodeDef) && isPositionTracking(nodeDef),
    clear: setProp(propKeys.positionTracking, false),
  },
  {
    isToClear: (nodeDef) => !canBeHiddenInReport(nodeDef) && isHiddenInReport(nodeDef),
    clear: assocProp({ key: keysPropsAdvanced.hiddenInReport, value: false }),
  },
  {
    isToClear: (nodeDef) => NodeDefLayout.isHiddenWhenNotRelevant(cycle)(nodeDef) && A.isEmpty(getApplicable(nodeDef)),
    clear: dissocLayoutProp({ cycle, prop: NodeDefLayout.keys.hiddenWhenNotRelevant }),
  },
  {
    isToClear: (nodeDef) => isDefaultValueEvaluatedOneTime(nodeDef) && A.isEmpty(getDefaultValues(nodeDef)),
    clear: assocDefaultValueEvaluatedOnlyOneTime(false),
  },
]

export const clearNotApplicableProps =
  (cycle: string): NodeDefUpdater =>
  (nodeDef) => {
    let nodeDefUpdated = nodeDef
    for (const { isToClear, clear } of notApplicablePropClearers(cycle)) {
      if (isToClear(nodeDefUpdated)) {
        nodeDefUpdated = clear(nodeDefUpdated)
      }
    }
    return nodeDefUpdated
  }
