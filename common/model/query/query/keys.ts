export const keys = {
  mode: 'mode',
  displayType: 'displayType',
  filter: 'filter',
  sort: 'sort',
  entityDefUuid: 'entityDefUuid',
  attributeDefUuids: 'attributeDefUuids',
  dimensions: 'dimensions',
  measures: 'measures',
  filterRecordUuid: 'filterRecordUuid',
  filterRecordUuids: 'filterRecordUuids',
} as const

export const modes = {
  raw: 'raw',
  rawEdit: 'rawEdit',
  aggregate: 'aggregate',
} as const

export const displayTypes = {
  table: 'table',
} as const
