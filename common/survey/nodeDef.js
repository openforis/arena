const R = require('ramda')
const { uuidv4 } = require('../uuid')

const SurveyUtils = require('./surveyUtils')
const NodeDefValidations = require('./nodeDefValidations')

const { isBlank } = require('../stringUtils')

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
  uuid: 'uuid',
  props: 'props',
  meta: 'meta',
  draftAdvanced: 'draftAdvanced'
}

const propKeys = {
  applicable: 'applicable',
  defaultValues: 'defaultValues',
  descriptions: 'descriptions',
  key: 'key',
  labels: 'labels',
  multiple: 'multiple',
  name: 'name',
  parentUuid: 'parentUuid',
  published: 'published',
  readOnly: 'readOnly',
  type: 'type',
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

const newNodeDef = (parentUuid, type, props) => ({
  uuid: uuidv4(),
  parentUuid,
  type,
  props,
})

// ==== READ

const getType = R.prop(propKeys.type)
const getName = SurveyUtils.getProp(propKeys.name, '')
const getParentUuid = SurveyUtils.getParentUuid

const isKey = R.pipe(SurveyUtils.getProp(propKeys.key), R.equals(true))
const isRoot = R.pipe(getParentUuid, R.isNil)
const isMultiple = R.pipe(SurveyUtils.getProp(propKeys.multiple), R.equals(true))
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

const isPublished = R.propEq(propKeys.published, true)

const getLabel = (nodeDef, lang) => {
  const label = R.path([keys.props, propKeys.labels, lang], nodeDef)
  return isBlank(label) || label === undefined
    ? getName(nodeDef)
    : label
}

const getDefaultValues = SurveyUtils.getProp(propKeys.defaultValues, [])
const hasDefaultValues = R.pipe(getDefaultValues, R.isEmpty, R.not)

const getValidations = SurveyUtils.getProp(propKeys.validations, {})

// ==== READ meta
const getMetaHierarchy = R.pathOr([], [keys.meta, metaKeys.h])

const getParentCodeDefUuid = SurveyUtils.getProp(propKeys.parentCodeDefUuid)

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
  getUuid: SurveyUtils.getUuid,
  getProp: SurveyUtils.getProp,
  isEqual: SurveyUtils.isEqual,

  getType,
  getName,
  getParentUuid,
  getLabels: SurveyUtils.getLabels,
  getLabel,
  getDescriptions: SurveyUtils.getProp(propKeys.descriptions, {}),
  getCategoryUuid: SurveyUtils.getProp(propKeys.categoryUuid),
  getParentCodeDefUuid,
  getTaxonomyUuid: SurveyUtils.getProp(propKeys.taxonomyUuid),

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
  isReadOnly: SurveyUtils.getProp(propKeys.readOnly, false),

  isBoolean,
  isCode,
  isCoordinate,
  isDecimal,
  isFile,
  isInteger,
  isTaxon,

  isPublished,

  //advanced props
  getDefaultValues,
  hasDefaultValues,
  getApplicable: SurveyUtils.getProp(propKeys.applicable, []),
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
