const R = require('ramda')
const {uuidv4} = require('../uuid')

const {
  // getProps,
  getProp,
  getLabels,

  // setProp,
} = require('./surveyUtils')

// ======== NODE DEF PROPERTIES

const nodeDefType = {
  integer: 'integer',
  decimal: 'decimal',
  string: 'string',
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

// ==== UPDATE

module.exports = {
  nodeDefType,
  getNodeDefType: R.prop('type'),

// props
//   getNodeDefProps: getProps,
  getNodeDefProp: getProp,
//   setNodeDefProp: setProp,
  getNodeDefLabels: getLabels,
  getNodeDefDescriptions: getProp('descriptions', {}),

  // READ

  //CREATE
  newNodeDef,
}
