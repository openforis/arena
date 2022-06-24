import * as R from 'ramda'
import { uuidv4 } from '@core/uuid'
import * as A from '@core/arena'

import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'

import * as TextUtils from '@webapp/utils/textUtils'

import * as NodeDefLayout from './nodeDefLayout'
import * as NodeDefValidations from './nodeDefValidations'

// ======== NODE DEF PROPERTIES

export const nodeDefType = {
  integer: 'integer',
  decimal: 'decimal',
  text: 'text',
  date: 'date',
  time: 'time',
  boolean: 'boolean',
  code: 'code',
  coordinate: 'coordinate',
  taxon: 'taxon',
  file: 'file',
  entity: 'entity',
}

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
  draftAdvancedValidations: 'draftAdvancedValidations',
  type: 'type',
  deleted: 'deleted',
  analysis: 'analysis',
  published: 'published',
  temporary: 'temporary', // Not persisted yet
  // Analysis
  virtual: 'virtual', // Virtual Entity
}

export const NodeDefLabelTypes = {
  name: 'name',
  label: 'label',
}

export const propKeys = {
  cycles: 'cycles',
  descriptions: ObjectUtils.keysProps.descriptions,
  key: 'key',
  labels: ObjectUtils.keysProps.labels,
  multiple: 'multiple',
  name: ObjectUtils.keys.name,
  readOnly: 'readOnly',
  layout: 'layout',

  // Text
  textTransform: 'textTransform',

  // Decimal
  maxNumberDecimalDigits: 'maxNumberDecimalDigits',

  // Boolean
  labelValue: 'labelValue',

  // Code
  categoryUuid: 'categoryUuid',
  parentCodeDefUuid: 'parentCodeDefUuid',
  // Taxon
  taxonomyUuid: 'taxonomyUuid',
  vernacularNameLabels: 'vernacularNameLabels',

  // File
  maxFileSize: 'maxFileSize', // max file size in MB
  fileType: 'fileType',
}

export const textTransformValues = {
  [TextUtils.textTransformValues.none]: TextUtils.textTransformValues.none,
  [TextUtils.textTransformValues.lowercase]: TextUtils.textTransformValues.lowercase,
  [TextUtils.textTransformValues.uppercase]: TextUtils.textTransformValues.uppercase,
  [TextUtils.textTransformValues.capitalize]: TextUtils.textTransformValues.capitalize,
}

export const booleanLabelValues = {
  trueFalse: 'trueFalse',
  yesNo: 'yesNo',
}

export const fileTypeValues = {
  image: 'image',
  video: 'video',
  audio: 'audio',
  other: 'other',
}

export const keysPropsAdvanced = {
  applicable: 'applicable',
  defaultValues: 'defaultValues',
  defaultValueEvaluatedOneTime: 'defaultValueEvaluatedOneTime',
  validations: 'validations',
  formula: 'formula',

  // Analisys
  script: 'script',
  chainUuid: 'chainUuid',
  index: 'index',
  active: 'active',
  aggregateFunctions: 'aggregateFunctions',

  isBaseUnit: 'isBaseUnit',
  isSampling: 'isSampling',
  areaBasedEstimatedOf: 'areaBasedEstimatedOf',
}

const metaKeys = {
  h: 'h',
}

export const maxKeyAttributes = 3
const MAX_FILE_SIZE_DEFAULT = 10

// ==== READ

export const {
  getLabels,
  getParentUuid,
  getProp,
  getProps,
  getPropsDraft,
  getUuid,
  getId,
  isEqual,
  isPublished,
  isTemporary,
} = ObjectUtils

export const getType = R.prop(keys.type)
export const getName = getProp(propKeys.name, '')
export const getCycles = getProp(propKeys.cycles, [])

export const isKey = ObjectUtils.isPropTrue(propKeys.key)
export const isRoot = R.pipe(getParentUuid, R.isNil)
export const isMultiple = ObjectUtils.isPropTrue(propKeys.multiple)
export const isSingle = R.pipe(isMultiple, R.not)

const isType = (type) => R.pipe(getType, R.equals(type))

export const isEntity = isType(nodeDefType.entity)
export const isSingleEntity = (nodeDef) => isEntity(nodeDef) && isSingle(nodeDef)
export const isMultipleEntity = (nodeDef) => isEntity(nodeDef) && isMultiple(nodeDef)
export const isEntityOrMultiple = (nodeDef) => isEntity(nodeDef) || isMultiple(nodeDef)

export const isAttribute = R.pipe(isEntity, R.not)
export const isSingleAttribute = (nodeDef) => isAttribute(nodeDef) && isSingle(nodeDef)
export const isMultipleAttribute = (nodeDef) => isAttribute(nodeDef) && isMultiple(nodeDef)
export const isAttributeComposite = (nodeDef) =>
  [nodeDefType.coordinate, nodeDefType.date, nodeDefType.file, nodeDefType.taxon, nodeDefType.time].includes(
    getType(nodeDef)
  )

export const isBoolean = isType(nodeDefType.boolean)
export const isCode = isType(nodeDefType.code)
export const isCoordinate = isType(nodeDefType.coordinate)
export const isDate = isType(nodeDefType.date)
export const isDecimal = isType(nodeDefType.decimal)
export const isFile = isType(nodeDefType.file)
export const isInteger = isType(nodeDefType.integer)
export const isTaxon = isType(nodeDefType.taxon)
export const isText = isType(nodeDefType.text)
export const isTime = isType(nodeDefType.time)

export const isReadOnly = getProp(propKeys.readOnly, false)

export const getLayout = getProp(propKeys.layout, {})

export const isDeleted = ObjectUtils.isKeyTrue(keys.deleted)

export const getDescriptions = getProp(propKeys.descriptions, {})
// code
export const getCategoryUuid = getProp(propKeys.categoryUuid)
// taxon
export const getTaxonomyUuid = getProp(propKeys.taxonomyUuid)
export const getVernacularNameLabels = getProp(propKeys.vernacularNameLabels, {})
export const getVernacularNameLabel = (lang) => (nodeDef) => getVernacularNameLabels(nodeDef)[lang]
// text
export const getTextTransform = getProp(propKeys.textTransform, textTransformValues.none)
export const getTextTransformFunction = (nodeDef) =>
  TextUtils.transform({ transformFunction: getTextTransform(nodeDef) })
// decimal
export const getMaxNumberDecimalDigits = (nodeDef) => {
  const decimalDigits = getProp(propKeys.maxNumberDecimalDigits, NaN)(nodeDef)
  return A.isEmpty(decimalDigits) ? NaN : Number(decimalDigits)
}
// File
export const isNumberOfFilesEnabled = isMultiple
export const getMaxFileSize = (nodeDef) => Number(getProp(propKeys.maxFileSize, MAX_FILE_SIZE_DEFAULT)(nodeDef))
export const getFileType = getProp(propKeys.fileType, fileTypeValues.other)

export const getLabelValue = getProp(propKeys.labelValue, booleanLabelValues.trueFalse)
export const isBooleanLabelYesNo = (nodeDef) =>
  isBoolean(nodeDef) && getProp(propKeys.labelValue, booleanLabelValues.trueFalse)(nodeDef) === booleanLabelValues.yesNo

// ==== READ meta
export const getMeta = R.propOr({}, keys.meta)
export const getMetaHierarchy = R.pathOr([], [keys.meta, metaKeys.h])

// Utils
export const getLabel = (nodeDef, lang, type = NodeDefLabelTypes.label) => {
  let firstPart = null

  if (type === NodeDefLabelTypes.name) {
    firstPart = getName(nodeDef)
  } else {
    let label = R.path([keys.props, propKeys.labels, lang], nodeDef)
    if (StringUtils.isBlank(label)) {
      firstPart = getName(nodeDef)
    } else {
      firstPart = label
    }
  }

  const suffix = isVirtual(nodeDef) ? ' (V)' : isAnalysis(nodeDef) && isAttribute(nodeDef) ? ' (C)' : ''

  return firstPart + suffix
}
export const getLabelWithType = ({ nodeDef, lang, type }) => getLabel(nodeDef, lang, type)

export const getDescription = (lang) => (nodeDef) => R.propOr('', lang, getDescriptions(nodeDef))

export const getCycleFirst = R.pipe(getCycles, R.head)

export const isAncestorOf = (nodeDefDescendant) => (nodeDef) =>
  R.startsWith([...getMetaHierarchy(nodeDef), getUuid(nodeDef)], getMetaHierarchy(nodeDefDescendant))

export const isDescendantOf = (nodeDefAncestor) => (nodeDef) => {
  const hAncestor = [...getMetaHierarchy(nodeDefAncestor), getUuid(nodeDefAncestor)]
  return R.startsWith(hAncestor, getMetaHierarchy(nodeDef))
}

// Advanced props

export const getPropsAdvanced = R.propOr({}, keys.propsAdvanced)
export const getPropsAdvancedDraft = R.propOr({}, keys.propsAdvancedDraft)

export const getPropAdvanced = (prop, defaultTo = null) =>
  R.pipe(getPropsAdvanced, R.pathOr(defaultTo, prop.split('.')))

export const getPropAdvancedDraft = (prop, defaultTo = null) =>
  R.pipe(getPropsAdvancedDraft, R.pathOr(defaultTo, prop.split('.')))

export const getPropOrDraftAdvanced =
  (prop, defaultTo = null) =>
  (nodeDef) =>
    getPropAdvancedDraft(prop, getPropAdvanced(prop, defaultTo)(nodeDef))(nodeDef)

export const hasAdvancedPropsDraft = (nodeDef) => R.prop(keys.draftAdvanced, nodeDef) === true
export const hasAdvancedPropsApplicableDraft = (nodeDef) => R.prop(keys.draftAdvancedApplicable, nodeDef) === true
export const hasAdvancedPropsDefaultValuesDraft = (nodeDef) => R.prop(keys.draftAdvancedDefaultValues, nodeDef) === true
export const hasAdvancedPropsValidationsDraft = (nodeDef) => R.prop(keys.draftAdvancedValidations, nodeDef) === true
const isPropAdvanced = (key) => Object.keys(keysPropsAdvanced).includes(key)

export const getDefaultValues = getPropAdvanced(keysPropsAdvanced.defaultValues, [])
export const hasDefaultValues = R.pipe(getDefaultValues, R.isEmpty, R.not)
export const isDefaultValueEvaluatedOneTime = getPropAdvanced(keysPropsAdvanced.defaultValueEvaluatedOneTime, false)

export const getValidations = getPropAdvanced(keysPropsAdvanced.validations, {})
export const getValidationExpressions = R.pipe(getValidations, NodeDefValidations.getExpressions)

export const getApplicable = getPropAdvanced(keysPropsAdvanced.applicable, [])

// Advanced props - Analysis
export const getFormula = getPropAdvanced(keysPropsAdvanced.formula, [])

export const getParentCodeDefUuid = getProp(propKeys.parentCodeDefUuid)

export const getChainUuid = getPropOrDraftAdvanced(keysPropsAdvanced.chainUuid, null)

export const getChainIndex = getPropOrDraftAdvanced(keysPropsAdvanced.index, 0)

export const getActive = getPropAdvanced(keysPropsAdvanced.active, false)
export const getScript = getPropOrDraftAdvanced(keysPropsAdvanced.script, '')

export const getAggregateFunctions = getPropOrDraftAdvanced(keysPropsAdvanced.aggregateFunctions, {})
export const getAggregateFunctionByUuid = (uuid) => R.pipe(getAggregateFunctions, R.propOr(null, uuid))

// READ Analysis
export const isAnalysis = ObjectUtils.isKeyTrue(keys.analysis)
export const isVirtual = ObjectUtils.isKeyTrue(keys.virtual)
export const isReadOnlyOrAnalysis = (nodeDef) => isReadOnly(nodeDef) || isAnalysis(nodeDef)

export const isBaseUnit = (nodeDef) => Boolean(getPropOrDraftAdvanced(keysPropsAdvanced.isBaseUnit, false)(nodeDef))
export const isSampling = (nodeDef) => Boolean(getPropOrDraftAdvanced(keysPropsAdvanced.isSampling, false)(nodeDef))
export const getAreaBasedEstimatedOf = getPropOrDraftAdvanced(keysPropsAdvanced.areaBasedEstimatedOf, false)
export const isAreaBasedEstimatedOf = (nodeDef) => Boolean(getAreaBasedEstimatedOf(nodeDef))

// ==== CREATE

export const newNodeDef = (
  nodeDefParent,
  type,
  cycles,
  props,
  propsAdvanced = {},
  analysis = false,
  virtual = false
) => ({
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
})

// ==== UPDATE

export const assocParentUuid = R.assoc(keys.parentUuid)
export const assocMetaHierarchy = R.assocPath([keys.meta, metaKeys.h])
export const { mergeProps } = ObjectUtils
const assocPropsAdvanced = R.assoc(keys.propsAdvanced)
export const mergePropsAdvanced = (propsAdvanced) => (nodeDef) =>
  R.pipe(getPropsAdvanced, R.mergeLeft(propsAdvanced), (propsAdvancedUpdated) =>
    assocPropsAdvanced(propsAdvancedUpdated, nodeDef)
  )(nodeDef)
export const assocValidations = (validations) => mergePropsAdvanced({ [keysPropsAdvanced.validations]: validations })
export const dissocTemporary = R.dissoc(keys.temporary)
export const assocProp = ({ key, value }) =>
  isPropAdvanced(key) ? mergePropsAdvanced({ [key]: value }) : mergeProps({ [key]: value })
export const assocCycles = (cycles) => assocProp({ key: propKeys.cycles, value: cycles })
// layout
export const assocLayout = (layout) => ObjectUtils.setProp(propKeys.layout, layout)

export const updateLayout = (updateFn) => (nodeDef) => {
  const layout = getLayout(nodeDef)
  const layoutUpdated = updateFn(layout)
  return assocLayout(layoutUpdated)(nodeDef)
}

export const copyLayout =
  ({ cycleFrom, cyclesTo }) =>
  (nodeDef) =>
    updateLayout((layout) => {
      const layoutCycle = NodeDefLayout.getLayoutCycle(cycleFrom)(nodeDef)
      const layoutUpdated = cyclesTo
        .filter((cycleKey) => cycleKey !== cycleFrom)
        .reduce((layoutAcc, cycleKey) => NodeDefLayout.assocLayoutCycle(cycleKey, layoutCycle)(layoutAcc), layout)
      return layoutUpdated
    })(nodeDef)

// ==== UTILS
export const canNodeDefBeMultiple = (nodeDef) =>
  // Entity def but not root
  (isEntity(nodeDef) && !isRoot(nodeDef)) ||
  // Attribute def but not analysis
  (!isAnalysis(nodeDef) &&
    R.includes(getType(nodeDef), [
      nodeDefType.decimal,
      nodeDefType.code,
      nodeDefType.file,
      nodeDefType.integer,
      nodeDefType.text,
    ]))

export const canNodeDefTypeBeKey = (type) =>
  R.includes(type, [
    nodeDefType.date,
    nodeDefType.decimal,
    nodeDefType.code,
    nodeDefType.integer,
    nodeDefType.taxon,
    nodeDefType.text,
    nodeDefType.time,
  ])

export const canNodeDefBeKey = (nodeDef) => !isAnalysis(nodeDef) && canNodeDefTypeBeKey(getType(nodeDef))

export const canHaveDefaultValue = (nodeDef) =>
  isSingleAttribute(nodeDef) &&
  R.includes(getType(nodeDef), [
    nodeDefType.boolean,
    nodeDefType.code,
    nodeDefType.date,
    nodeDefType.decimal,
    nodeDefType.integer,
    nodeDefType.taxon,
    nodeDefType.text,
    nodeDefType.time,
  ]) &&
  // Allow default value when parent code is null (for node def code)
  !getParentCodeDefUuid(nodeDef)

export const belongsToAllCycles = (cycles) => (nodeDef) => R.isEmpty(R.difference(cycles, getCycles(nodeDef)))

const isEntityAndNotRoot = (nodeDef) => isEntity(nodeDef) && !isRoot(nodeDef)
export const isDisplayAsEnabled = isEntityAndNotRoot
export const isDisplayInEnabled = isEntityAndNotRoot
