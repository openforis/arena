const keywords = [
  'asc',
  'date_created',
  'date_modified',
  'desc',
  'file',
  'id',
  'length',
  'node_def_uuid',
  'owner_uuid',
  'parent_id',
  'parent_uuid',
  'props_advanced',
  'props_draft',
  'props',
  'record_cycle',
  'record_uuid',
  'step',
  'unique',
  'uuid',
  'value',
]

export const isKeyword = (value) => keywords.includes(value)
