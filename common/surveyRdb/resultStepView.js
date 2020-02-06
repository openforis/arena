import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

export const getViewName = stepUuid => `${SchemaRdb.resultTablePrefix}_${stepUuid}`

export const colNames = {
  parentUuid: 'parent_uuid',
}
