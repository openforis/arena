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
  //TODO remove attribute
  attribute: 'attribute',
  entity: 'entity',

  integer: 'integer',
  string: 'string',
  decimal: 'decimal',
  boolean: 'boolean',
  codeList: 'codeList',
  coordinate: 'coordinate',
  taxon: 'taxon',
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
//   getNodeDefProp: getProp,
//   setNodeDefProp: setProp,
  getNodeDefLabels: getLabels,
  getNodeDefDescriptions: getProp('descriptions', {}),

  // READ

  //CREATE
  newNodeDef,
}
