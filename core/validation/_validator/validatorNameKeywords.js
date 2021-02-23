import * as R from 'ramda'

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
  'props',
  'props_draft',
  'props_advanced',
  'record_uuid',
  'step',
  'uuid',
  'value',
]

export const isKeyword = (value) => R.includes(value, keywords)
