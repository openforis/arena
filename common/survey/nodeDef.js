const R = require('ramda')
const {uuidv4} = require('../uuid')

const SurveyUtils = require('./surveyUtils')
const NodeDefValidations = require('./nodeDefValidations')

const {isBlank} = require('../stringUtils')

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
  props: 'props',
  validation : 'validation',
}

const propKeys = {
  applicable: 'applicable',
  calculatedValues: 'calculatedValues',
  defaultValues: 'defaultValues',
  descriptions: 'descriptions',
  key: 'key',
  labels: 'labels',
  multiple: 'multiple',
  name: 'name',
  parentUuid: 'parentUuid',
  published: 'published',
  type: 'type',
  validations: 'validations',

  //code
  categoryUuid: 'categoryUuid',
  parentCodeDefUuid: 'parentCodeDefUuid',
  //taxon
  taxonomyUuid: 'taxonomyUuid'
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

const getNodeDefType = R.prop(propKeys.type)
const getNodeDefName = SurveyUtils.getProp(propKeys.name, '')
const getNodeDefParentUuid = SurveyUtils.getParentUuid

const isNodeDefKey = R.pipe(SurveyUtils.getProp(propKeys.key), R.equals(true))
const isNodeDefRoot = R.pipe(getNodeDefParentUuid, R.isNil)
const isNodeDefMultiple = R.pipe(SurveyUtils.getProp(propKeys.multiple), R.equals(true))

const isNodeDefType = type => R.pipe(getNodeDefType, R.equals(type))
const isNodeDefEntity = isNodeDefType(nodeDefType.entity)
const isNodeDefEntityOrMultiple = nodeDef => isNodeDefEntity(nodeDef) || isNodeDefMultiple(nodeDef)
const isNodeDefSingleEntity = nodeDef => isNodeDefEntity(nodeDef) && !isNodeDefMultiple(nodeDef)
const isNodeDefSingleAttribute = nodeDef => !(isNodeDefEntity(nodeDef) || isNodeDefMultiple(nodeDef))
const isNodeDefMultipleAttribute = nodeDef => !isNodeDefEntity(nodeDef) && isNodeDefMultiple(nodeDef)
const isNodeDefCode = isNodeDefType(nodeDefType.code)
const isNodeDefTaxon = isNodeDefType(nodeDefType.taxon)

const isNodeDefPublished = R.propEq(propKeys.published, true)

const getNodeDefLabel = (nodeDef, lang) => {
  const label = R.path([keys.props, propKeys.labels, lang], nodeDef)
  return isBlank(label)
    ? getNodeDefName(nodeDef)
    : label

}

const getValidations = SurveyUtils.getProp(propKeys.validations, {})

// ==== UPDATE

// ==== UTILS
const canNodeDefBeMultiple = nodeDef =>
  (isNodeDefEntity(nodeDef) && !isNodeDefRoot(nodeDef)) ||
  R.includes(
    getNodeDefType(nodeDef),
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
    getNodeDefType(nodeDef),
    [
      nodeDefType.date,
      nodeDefType.decimal,
      nodeDefType.code,
      nodeDefType.coordinate,
      nodeDefType.integer,
      nodeDefType.taxon,
      nodeDefType.text,
      nodeDefType.time
    ]
  )

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

  getNodeDefType,
  getNodeDefName,
  getNodeDefParentUuid,
  getNodeDefLabels: SurveyUtils.getLabels,
  getNodeDefLabel,
  getNodeDefDescriptions: SurveyUtils.getProp(propKeys.descriptions, {}),
  getNodeDefValidation: R.prop(keys.validation),
  getNodeDefCategoryUuid: SurveyUtils.getProp(propKeys.categoryUuid),
  getNodeDefParentCodeDefUuid: SurveyUtils.getProp(propKeys.parentCodeDefUuid),
  getNodeDefTaxonomyUuid: SurveyUtils.getProp(propKeys.taxonomyUuid),

  isNodeDefKey,
  isNodeDefMultiple,
  isNodeDefRoot,
  isNodeDefEntity,
  isNodeDefEntityOrMultiple,
  isNodeDefSingleEntity,
  isNodeDefSingleAttribute,
  isNodeDefMultipleAttribute,
  isNodeDefCode,
  isNodeDefTaxon,
  isNodeDefPublished,

  //advanced props
  getDefaultValues: SurveyUtils.getProp(propKeys.defaultValues, []),
  getCalculatedValues: SurveyUtils.getProp(propKeys.calculatedValues, []),
  getApplicable: SurveyUtils.getProp(propKeys.applicable, []),
  getValidations,
  getValidationExpressions: R.pipe(
    getValidations,
    NodeDefValidations.getExpressions,
  ),

  //UTILS
  canNodeDefBeMultiple,
  canNodeDefBeKey,
}
