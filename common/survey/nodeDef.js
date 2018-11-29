const R = require('ramda')
const {uuidv4} = require('../uuid')

const {
  getProp,
  getLabels,
} = require('./surveyUtils')

const {isBlank} = require('../stringUtils')

const validation = 'validation'

// ======== NODE DEF PROPERTIES

const nodeDefType = {
  integer: 'integer',
  decimal: 'decimal',
  text: 'text',
  date: 'date',
  time: 'time',
  boolean: 'boolean',
  codeList: 'codeList',
  coordinate: 'coordinate',
  taxon: 'taxon',
  file: 'file',
  entity: 'entity',
}

const maxKeyAttributes = 3

// ==== CREATE

const newNodeDef = (surveyId, parentId, type, props) => ({
  surveyId,
  uuid: uuidv4(),
  parentId,
  type,
  props,
})

// ==== READ

const getNodeDefType = R.prop('type')
const getNodeDefName = getProp('name', '')
const getNodeDefParentId = R.prop('parentId')

const isNodeDefKey = R.pipe(getProp('key'), R.equals(true))
const isNodeDefMultiple = R.pipe(getProp('multiple'), R.equals(true))
const isNodeDefRoot = R.pipe(getNodeDefParentId, R.isNil)

const isNodeDefType = type => R.pipe(getNodeDefType, R.equals(type))
const isNodeDefEntity = isNodeDefType(nodeDefType.entity)
const isNodeDefSingleEntity = nodeDef => isNodeDefEntity(nodeDef) && !isNodeDefMultiple(nodeDef)
const isNodeDefCodeList = isNodeDefType(nodeDefType.codeList)
const isNodeDefTaxon = isNodeDefType(nodeDefType.taxon)

const isNodeDefPublished = R.propEq('published', true)

// ==== UPDATE

// ==== UTILS
const canNodeDefBeMultiple = nodeDef =>
  (isNodeDefEntity(nodeDef) && !isNodeDefRoot(nodeDef)) ||
  R.contains(
    getNodeDefType(nodeDef),
    [
      nodeDefType.decimal,
      nodeDefType.codeList,
      nodeDefType.file,
      nodeDefType.integer,
      nodeDefType.text
    ]
  )

const canNodeDefBeKey = nodeDef =>
  R.contains(
    getNodeDefType(nodeDef),
    [
      nodeDefType.date,
      nodeDefType.decimal,
      nodeDefType.codeList,
      nodeDefType.coordinate,
      nodeDefType.integer,
      nodeDefType.taxon,
      nodeDefType.text,
      nodeDefType.time
    ]
  )

const getNodeDefLabel = (nodeDef, lang) => {
  const label = R.path(['props', 'labels', lang], nodeDef)
  return isBlank(label)
    ? getNodeDefName(nodeDef)
    : label

}

module.exports = {
  nodeDefType,
  maxKeyAttributes,

  //CREATE
  newNodeDef,

  //READ
  getNodeDefType,
  getNodeDefName,
  getNodeDefParentId,
  getNodeDefLabels: getLabels,
  getNodeDefDescriptions: getProp('descriptions', {}),
  getNodeDefValidation: R.prop(validation),
  getNodeDefCodeListUUID: getProp('codeListUUID'),
  getNodeDefParentCodeUUID: getProp('parentCodeUUID'),
  getNodeDefTaxonomyUUID: getProp('taxonomyUUID'),

  //advanced props
  getDefaultValues: getProp('defaultValues', []),

  isNodeDefKey,
  isNodeDefMultiple,
  isNodeDefRoot,
  isNodeDefEntity,
  isNodeDefSingleEntity,
  isNodeDefCodeList,
  isNodeDefTaxon,
  isNodeDefPublished,

  //UTILS
  canNodeDefBeMultiple,
  canNodeDefBeKey,
  getNodeDefLabel,
}
