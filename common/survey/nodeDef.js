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

const isNodeDefEntity = R.pipe(getNodeDefType, R.equals(nodeDefType.entity))

const isNodeDefRoot = R.pipe(R.prop('parentId'), R.isNil)

// ==== UPDATE

// ==== UTILS
const canNodeDefBeMultiple = nodeDef =>
  (isNodeDefEntity(nodeDef) && !isNodeDefRoot(nodeDef)) ||
  R.contains(
    getNodeDefType(nodeDef),
    [nodeDefType.decimal, nodeDefType.codeList, nodeDefType.file, nodeDefType.integer, nodeDefType.text]
  )

module.exports = {
  nodeDefType,

  //CREATE
  newNodeDef,

  //READ
  getNodeDefType,
  getNodeDefName: getProp('name', ''),
  isNodeDefKey: R.pipe(getProp('key'), R.equals(true)),
  isNodeDefEntity,
  isNodeDefMultiple: R.pipe(getProp('multiple'), R.equals(true)),
  getNodeDefLabels: getLabels,
  getNodeDefDescriptions: getProp('descriptions', {}),
  getNodeDefValidation: R.prop(validation),
  isNodeDefRoot,

  //UTILS
  canNodeDefBeMultiple,
}
