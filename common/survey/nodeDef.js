const R = require('ramda')
const {uuidv4} = require('../uuid')

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

// ======== CREATE

const createNodeDef = (surveyId, type, props) => ({
  surveyId,
  type,

  props,
})

const createEntityDef = (surveyId, props) => createNodeDef(surveyId, nodeDefType.entity, props)

const createAttributeDef = (surveyId, props) => createNodeDef(surveyId, nodeDefType.attribute, props)

module.exports = {
  nodeDefType,
  attributeDefType,
  entityDefRenderType,

  //create
  createEntityDef,
  createAttributeDef,
}
