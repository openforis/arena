const R = require('ramda')
const {uuidv4} = require('../uuid')

const {
  getProp,
  getLabels,
} = require('./surveyUtils')

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

const isNodeDefKey = R.pipe(getProp('key'), R.equals(true))
const isNodeDefMultiple = R.pipe(getProp('multiple'), R.equals(true))

const isNodeDefRoot = R.pipe(R.prop('parentId'), R.isNil)
const isNodeDefEntity = R.pipe(getNodeDefType, R.equals(nodeDefType.entity))
const isNodeDefSingleEntity = nodeDef => isNodeDefEntity(nodeDef) && !isNodeDefMultiple(nodeDef)

// ==== UPDATE

// ==== UTILS
const canNodeDefBeMultiple = nodeDef =>
  (isNodeDefEntity(nodeDef) && !isNodeDefRoot(nodeDef)) ||
  R.contains(
    getNodeDefType(nodeDef),
    [nodeDefType.decimal, nodeDefType.codeList, nodeDefType.file, nodeDefType.integer, nodeDefType.text]
  )

const getNodeDefLabel = (nodeDef, lang) =>{
  const label = R.path(['props','labels',lang], nodeDef)
  return R.defaultTo(
    getNodeDefName(nodeDef),
    label
  )
}

module.exports = {
  nodeDefType,

  //CREATE
  newNodeDef,

  //READ
  getNodeDefType,
  getNodeDefName,
  getNodeDefLabels: getLabels,
  getNodeDefDescriptions: getProp('descriptions', {}),
  getNodeDefValidation: R.prop(validation),

  isNodeDefKey,
  isNodeDefMultiple,
  isNodeDefRoot,
  isNodeDefEntity,
  isNodeDefSingleEntity,

  //UTILS
  canNodeDefBeMultiple,
  getNodeDefLabel,
}
