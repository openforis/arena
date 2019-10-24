const R = require('ramda')
const { uuidv4 } = require('@core/uuid')

const ObjectUtils = require('@core/objectUtils')
const NodeDefValidations = require('./nodeDefValidations')

const StringUtils = require('@core/stringUtils')

// ======== NODE DEF PROPERTIES

const nodeDefType = {
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

const keys = {
  uuid: ObjectUtils.keys.uuid,
  parentUuid: ObjectUtils.keys.parentUuid,
  props: ObjectUtils.keys.props,
  meta: 'meta',
  draftAdvanced: 'draftAdvanced',
  type: 'type',
  deleted: 'deleted',
  analysis: 'analysis',
  published: 'published',
}

const propKeys = {
  applicable: 'applicable',
  cycles: 'cycles',
  defaultValues: 'defaultValues',
  descriptions: ObjectUtils.keysProps.descriptions,
  key: 'key',
  labels: ObjectUtils.keysProps.labels,
  multiple: 'multiple',
  name: ObjectUtils.keys.name,
  readOnly: 'readOnly',
  validations: 'validations',

  //code
  categoryUuid: 'categoryUuid',
  parentCodeDefUuid: 'parentCodeDefUuid',
  //taxon
  taxonomyUuid: 'taxonomyUuid'
}

const metaKeys = {
  h: 'h',
}

const maxKeyAttributes = 3

// ==== CREATE

const newNodeDef = (parentUuid, type, cycle, props, analysis = false) => ({
  [keys.uuid]: uuidv4(),
  [keys.parentUuid]: parentUuid,
  [keys.type]: type,
  [keys.analysis]: analysis,
  [keys.props]: {
    ...props,
    [propKeys.cycles]: [cycle]
  },
})

// ==== READ

const getType = R.prop(keys.type)
const getName = ObjectUtils.getProp(propKeys.name, '')
const getParentUuid = ObjectUtils.getParentUuid
const getCycles = ObjectUtils.getProp(propKeys.cycles, [])

const isKey = R.pipe(ObjectUtils.getProp(propKeys.key), R.equals(true))
const isRoot = R.pipe(getParentUuid, R.isNil)
const isMultiple = R.pipe(ObjectUtils.getProp(propKeys.multiple), R.equals(true))
const isSingle = R.pipe(isMultiple, R.not)

const isType = type => R.pipe(getType, R.equals(type))

const isEntity = isType(nodeDefType.entity)
const isSingleEntity = nodeDef => isEntity(nodeDef) && isSingle(nodeDef)
const isMultipleEntity = nodeDef => isEntity(nodeDef) && isMultiple(nodeDef)
const isEntityOrMultiple = nodeDef => isEntity(nodeDef) || isMultiple(nodeDef)

const isAttribute = R.pipe(isEntity, R.not)
const isSingleAttribute = nodeDef => isAttribute(nodeDef) && isSingle(nodeDef)
const isMultipleAttribute = nodeDef => isAttribute(nodeDef) && isMultiple(nodeDef)

const isBoolean = isType(nodeDefType.boolean)
const isCode = isType(nodeDefType.code)
const isCoordinate = isType(nodeDefType.coordinate)
const isDecimal = isType(nodeDefType.decimal)
const isFile = isType(nodeDefType.file)
const isInteger = isType(nodeDefType.integer)
const isTaxon = isType(nodeDefType.taxon)

const isPublished = R.propEq(keys.published, true)
const isDeleted = R.propEq(keys.deleted, true)
const isAnalysis = R.propEq(keys.analysis, true)

const getLabel = (nodeDef, lang) => {
  const label = R.path([keys.props, propKeys.labels, lang], nodeDef)
  return StringUtils.isBlank(label)
    ? getName(nodeDef)
    : label
}

const getDefaultValues = ObjectUtils.getProp(propKeys.defaultValues, [])
const hasDefaultValues = R.pipe(getDefaultValues, R.isEmpty, R.not)

const getValidations = ObjectUtils.getProp(propKeys.validations, {})

// ==== READ meta
const getMetaHierarchy = R.pathOr([], [keys.meta, metaKeys.h])

const getParentCodeDefUuid = ObjectUtils.getProp(propKeys.parentCodeDefUuid)

// ==== UPDATE

// ==== UTILS
const canNodeDefBeMultiple = nodeDef =>
  (isEntity(nodeDef) && !isRoot(nodeDef)) ||
  R.includes(
    getType(nodeDef),
    [
      nodeDefType.decimal,
      nodeDefType.code,
      nodeDefType.file,
      nodeDefType.integer,
      nodeDefType.text
    ]
  )

const canNodeDefBeKey = nodeDef => canNodeDefTypeBeKey(getType(nodeDef))

const canNodeDefTypeBeKey = type =>
  R.includes(type,
    [
      nodeDefType.date,
      nodeDefType.decimal,
      nodeDefType.code,
      nodeDefType.integer,
      nodeDefType.taxon,
      nodeDefType.text,
      nodeDefType.time
    ]
  )

const canHaveDefaultValue = nodeDef =>
  isSingleAttribute(nodeDef) &&
  R.includes(
    getType(nodeDef),
    [
      nodeDefType.boolean,
      nodeDefType.code,
      nodeDefType.date,
      nodeDefType.decimal,
      nodeDefType.integer,
      nodeDefType.taxon,
      nodeDefType.text,
      nodeDefType.time,
    ]
  )
  // allow default value when parent code is null (for node def code)
  && !getParentCodeDefUuid(nodeDef)

module.exports = {
  nodeDefType,
  keys,
  propKeys,
  maxKeyAttributes,

  //CREATE
  newNodeDef,

  //READ
  getUuid: ObjectUtils.getUuid,
  getProp: ObjectUtils.getProp,
  getProps: ObjectUtils.getProps,
  isEqual: ObjectUtils.isEqual,

  getType,
  getName,
  getParentUuid,
  getLabels: ObjectUtils.getLabels,
  getLabel,
  getDescriptions: ObjectUtils.getProp(propKeys.descriptions, {}),
  getCategoryUuid: ObjectUtils.getProp(propKeys.categoryUuid),
  getParentCodeDefUuid,
  getTaxonomyUuid: ObjectUtils.getProp(propKeys.taxonomyUuid),
  getCycles,
  getCycleFirst: R.pipe(getCycles, R.head),

  isKey,
  isMultiple,
  isSingle,
  isRoot,
  isEntity,
  isAttribute,
  isEntityOrMultiple,
  isSingleEntity,
  isMultipleEntity,
  isSingleAttribute,
  isMultipleAttribute,
  isReadOnly: ObjectUtils.getProp(propKeys.readOnly, false),

  isBoolean,
  isCode,
  isCoordinate,
  isDecimal,
  isFile,
  isInteger,
  isTaxon,

  isPublished,
  isDeleted,
  isAnalysis,

  //advanced props
  getDefaultValues,
  hasDefaultValues,
  getApplicable: ObjectUtils.getProp(propKeys.applicable, []),
  getValidations,
  getValidationExpressions: R.pipe(
    getValidations,
    NodeDefValidations.getExpressions,
  ),
  hasAdvancedPropsDraft: R.pipe(R.prop(keys.draftAdvanced), R.isEmpty, R.not),

  // meta
  getMetaHierarchy,

  //UTILS
  canNodeDefBeMultiple,
  canNodeDefBeKey,
  canNodeDefTypeBeKey,
  canHaveDefaultValue,
}
