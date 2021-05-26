import * as R from 'ramda'
import { uuidv4 } from '@core/uuid'

import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'

import * as TextUtils from '@webapp/utils/textUtils'

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

  // File
  maxFileSize: 'maxFileSize',
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
  validations: 'validations',
  formula: 'formula',
}

const metaKeys = {
  h: 'h',
}

export const maxKeyAttributes = 3

// ==== READ

export const { getLabels, getParentUuid, getProp, getProps, getPropsDraft, getUuid, getId, isEqual, isTemporary } =
  ObjectUtils
export const getPropsAdvancedDraft = R.propOr({}, keys.propsAdvancedDraft)

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

export const isPublished = ObjectUtils.isKeyTrue(keys.published)
export const isDeleted = ObjectUtils.isKeyTrue(keys.deleted)

export const getDescriptions = getProp(propKeys.descriptions, {})
export const getCategoryUuid = getProp(propKeys.categoryUuid)
export const getTaxonomyUuid = getProp(propKeys.taxonomyUuid)

export const getTextTransform = getProp(propKeys.textTransform, textTransformValues.none)
export const getTextTransformFunction = (nodeDef) =>
  TextUtils.transform({ transformFunction: getTextTransform(nodeDef) })

export const getMaxNumberDecimalDigits = (nodeDef) => Number(getProp(propKeys.maxNumberDecimalDigits, 6)(nodeDef))

// File
export const isNumberOfFilesEnabled = isMultiple
export const getMaxFileSize = (nodeDef) => Number(getProp(propKeys.maxFileSize)(nodeDef))
export const getFileType = getProp(propKeys.fileType, fileTypeValues.other)

export const getLabelValue = getProp(propKeys.labelValue, booleanLabelValues.trueFalse)
export const isBooleanLabelYesNo = (nodeDef) =>
  isBoolean(nodeDef) && getProp(propKeys.labelValue, booleanLabelValues.trueFalse)(nodeDef) === booleanLabelValues.yesNo

// READ Analysis
export const isAnalysis = ObjectUtils.isKeyTrue(keys.analysis)
export const isVirtual = ObjectUtils.isKeyTrue(keys.virtual)

// ==== READ meta
export const getMeta = R.propOr({}, keys.meta)
export const getMetaHierarchy = R.pathOr([], [keys.meta, metaKeys.h])

// Utils
export const getLabel = (nodeDef, lang, type = NodeDefLabelTypes.label) => {
  let label = R.path([keys.props, propKeys.labels, lang], nodeDef)
  const name = getName(nodeDef)
  if (type === NodeDefLabelTypes.name) {
    return name
  }

  if (StringUtils.isBlank(label)) {
    label = name
  }

  if (isVirtual(nodeDef)) {
    return `${label}${' (V)'}`
  }

  if (isAnalysis(nodeDef) && isAttribute(nodeDef)) {
    return `${label}${' (C)'}`
  }

  return label
}
export const getLabelWithType = ({ nodeDef, lang, type }) => getLabel(nodeDef, lang, type)

export const getCycleFirst = R.pipe(getCycles, R.head)

export const isDescendantOf = (nodeDefAncestor) => (nodeDef) => {
  const hAncestor = [...getMetaHierarchy(nodeDefAncestor), getUuid(nodeDefAncestor)]
  return R.startsWith(hAncestor, getMetaHierarchy(nodeDef))
}

// Advanced props
export const getPropsAdvanced = R.propOr({}, keys.propsAdvanced)
export const getPropAdvanced = (prop, defaultTo = null) =>
  R.pipe(getPropsAdvanced, R.pathOr(defaultTo, prop.split('.')))
export const hasAdvancedPropsDraft = R.pipe(R.prop(keys.draftAdvanced), R.isEmpty, R.not)
const isPropAdvanced = (key) => Object.keys(keysPropsAdvanced).includes(key)

export const getDefaultValues = getPropAdvanced(keysPropsAdvanced.defaultValues, [])
export const hasDefaultValues = R.pipe(getDefaultValues, R.isEmpty, R.not)

export const getValidations = getPropAdvanced(keysPropsAdvanced.validations, {})
export const getValidationExpressions = R.pipe(getValidations, NodeDefValidations.getExpressions)

export const getApplicable = getPropAdvanced(keysPropsAdvanced.applicable, [])

// Advanced props - Analysis
export const getFormula = getPropAdvanced(keysPropsAdvanced.formula, [])

export const getParentCodeDefUuid = getProp(propKeys.parentCodeDefUuid)

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
