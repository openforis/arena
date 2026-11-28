const keywords = new Set([
  'ancestor_uuid',
  'asc',
  'category',
  'date_created',
  'date_modified',
  'desc',
  'exp_factor_',
  'for',
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
  'record',
  'record_cycle',
  'record_owner_uuid',
  'record_step',
  'record_uuid',
  'step',
  'taxonomy',
  'unique',
  'uuid',
  'value',
  'weight',
])

export const isKeyword = (value: unknown): boolean => keywords.has(value as string)

// columns of the records summary query (see recordRepository fetchRecordsSummaryBySurveyId), selected next to the
// root key and qualifier attribute columns: an attribute with the same name would clash with them
const recordSummaryColumnNames = new Set([
  'cycle',
  'date_created',
  'date_modified',
  'info',
  'keys_obj',
  'merged_into_record_uuid',
  'owner_name',
  'owner_uuid',
  'preview',
  'read_only',
  'step',
  'summary_attributes_obj',
  'survey_uuid',
  'uuid',
  'validation',
])

export const isRecordSummaryColumnName = (value: unknown): boolean => recordSummaryColumnNames.has(value as string)
