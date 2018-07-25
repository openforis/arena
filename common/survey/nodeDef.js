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

module.exports = {
  nodeDefType,
  attributeDefType,
  entityDefRenderType,
}
