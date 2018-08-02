const R = require('ramda')
const {uuidv4} = require('../uuid')

// const {
//   getProps,
//   getProp,
//   getLabels,
//
//   setProp,
// } = require('./surveyUtils')

// ======== NODE DEF PROPERTIES

const nodeDefType = {
  attribute: 'attribute',
  entity: 'entity',
}

const attributeDefType = {
  integer: 'integer',
  string: 'string',
  decimal: 'decimal',
  boolean: 'boolean',
  codeList: 'codeList',
  coordinate: 'coordinate',
  taxon: 'taxon',
}

const entityDefRenderType = {
  form: 'form',
  table: 'table',
}

// ==== READ

const isNodeDefType = type => R.propEq('type', type)

const isNodeDefEntity = isNodeDefType(nodeDefType.entity)
const isNodeDefAttribute = isNodeDefType(nodeDefType.attribute)

// ==== CREATE

const newNodeDef = (surveyId, parentId, type, props) => ({
  surveyId,
  uuid: uuidv4(),
  parentId,
  type,
  props,
})

const newEntityDef = (surveyId, parentId, props) => newNodeDef(surveyId, parentId, nodeDefType.entity, props)

const newAttributeDef = (surveyId, parentId, props) => newNodeDef(surveyId, parentId, nodeDefType.attribute, props)

// ==== UPDATE

module.exports = {
  nodeDefType,
  attributeDefType,
  entityDefRenderType,

// props
//   getNodeDefProps: getProps,
//   getNodeDefProp: getProp,
//   setNodeDefProp: setProp,
//   getNodeDefLabels: getLabels,

  // READ
  isNodeDefAttribute,
  isNodeDefEntity,

  //CREATE
  newNodeDef,
  newEntityDef,
  newAttributeDef,
}
