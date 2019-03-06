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
  validation: 'validation',
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

const newNodeDef = (surveyId, parentUuid, type, props) => ({
  surveyId,
  uuid: uuidv4(),
  parentUuid,
  type,
  props,
})

// ==== READ

const getType = R.prop(propKeys.type)
const getNodeDefName = SurveyUtils.getProp(propKeys.name, '')
const getNodeDefParentUuid = SurveyUtils.getParentUuid

const isNodeDefKey = R.pipe(SurveyUtils.getProp(propKeys.key), R.equals(true))
const isNodeDefRoot = R.pipe(getNodeDefParentUuid, R.isNil)
const isNodeDefMultiple = R.pipe(SurveyUtils.getProp(propKeys.multiple), R.equals(true))
const isNodeDefSingle = R.pipe(isNodeDefMultiple, R.not)

const isNodeDefType = type => R.pipe(getType, R.equals(type))

const isNodeDefEntity = isNodeDefType(nodeDefType.entity)
const isNodeDefSingleEntity = nodeDef => isNodeDefEntity(nodeDef) && isNodeDefSingle(nodeDef)
const isNodeDefMultipleEntity = nodeDef => isNodeDefEntity(nodeDef) && isNodeDefMultiple(nodeDef)
const isNodeDefEntityOrMultiple = nodeDef => isNodeDefEntity(nodeDef) || isNodeDefMultiple(nodeDef)

const isNodeDefAttribute = R.pipe(isNodeDefEntity, R.not)
const isNodeDefSingleAttribute = nodeDef => isNodeDefAttribute(nodeDef) && isNodeDefSingle(nodeDef)
const isNodeDefMultipleAttribute = nodeDef => isNodeDefAttribute(nodeDef) && isNodeDefMultiple(nodeDef)

const isNodeDefBoolean = isNodeDefType(nodeDefType.boolean)
const isNodeDefCode = isNodeDefType(nodeDefType.code)
const isNodeDefCoordinate = isNodeDefType(nodeDefType.coordinate)
const isNodeDefDecimal = isNodeDefType(nodeDefType.decimal)
const isNodeDefFile = isNodeDefType(nodeDefType.file)
const isNodeDefInteger = isNodeDefType(nodeDefType.integer)
const isNodeDefTaxon = isNodeDefType(nodeDefType.taxon)

const isNodeDefPublished = R.propEq(propKeys.published, true)

const getNodeDefLabel = (nodeDef, lang) => {
  const label = R.path([keys.props, propKeys.labels, lang], nodeDef)
  return isBlank(label)
    ? getNodeDefName(nodeDef)
    : label

}

const getValidations = SurveyUtils.getProp(propKeys.validations, {})

// ==== READ meta
const getMetaHierarchy = R.pathOr([], [keys.meta, metaKeys.h])

const getNodeDefParentCodeDefUuid = SurveyUtils.getProp(propKeys.parentCodeDefUuid)

// ==== UPDATE

// ==== UTILS
const canNodeDefBeMultiple = nodeDef =>
  (isNodeDefEntity(nodeDef) && !isNodeDefRoot(nodeDef)) ||
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

const canNodeDefBeKey = nodeDef =>
  R.includes(
    getType(nodeDef),
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

const canNodeDefHaveDefaultValue = nodeDef =>
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
  && !getNodeDefParentCodeDefUuid(nodeDef)

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

  getType,
  getNodeDefName,
  getNodeDefParentUuid,
  getNodeDefLabels: SurveyUtils.getLabels,
  getNodeDefLabel,
  getNodeDefDescriptions: SurveyUtils.getProp(propKeys.descriptions, {}),
  getNodeDefValidation: R.prop(keys.validation),
  getNodeDefCategoryUuid: SurveyUtils.getProp(propKeys.categoryUuid),
  getNodeDefParentCodeDefUuid,
  getNodeDefTaxonomyUuid: SurveyUtils.getProp(propKeys.taxonomyUuid),

  isNodeDefKey,
  isNodeDefMultiple,
  isNodeDefSingle,
  isNodeDefRoot,
  isNodeDefEntity,
  isNodeDefAttribute,
  isNodeDefEntityOrMultiple,
  isNodeDefSingleEntity,
  isNodeDefMultipleEntity,
  isNodeDefSingleAttribute,
  isNodeDefMultipleAttribute,
  isNodeDefReadOnly: SurveyUtils.getProp(propKeys.readOnly, false),

  isNodeDefBoolean,
  isNodeDefCode,
  isNodeDefCoordinate,
  isNodeDefDecimal,
  isNodeDefFile,
  isNodeDefInteger,
  isNodeDefTaxon,

  isNodeDefPublished,

  //advanced props
  getDefaultValues: SurveyUtils.getProp(propKeys.defaultValues, []),
  getApplicable: SurveyUtils.getProp(propKeys.applicable, []),
  getValidations,
  getValidationExpressions: R.pipe(
    getValidations,
    NodeDefValidations.getExpressions,
  ),

  // meta
  getMetaHierarchy,

  //UTILS
  canNodeDefBeMultiple,
  canNodeDefBeKey,
  canNodeDefHaveDefaultValue,
}
