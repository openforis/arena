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
  species: 'species',
}

const entityDefRenderType = {
  inline: 'inline',
  table: 'table',
}

module.exports = {
  nodeDefType,
  attributeDefType,
  entityDefRenderType,
}
