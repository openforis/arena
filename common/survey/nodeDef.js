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

const createNodeDef = (nodeDef, type) => ({
  ...nodeDef,
  type,
  uuid: uuidv4(),
})

const createEntityDef = R.partialRight(createNodeDef, nodeDefType.entity)

const createAttributeDef = R.partialRight(createNodeDef, nodeDefType.attribute)

module.exports = {
  nodeDefType,
  attributeDefType,
  entityDefRenderType,

  //create
  createEntityDef,
  createAttributeDef,
}
