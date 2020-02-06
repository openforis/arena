import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

const getViewNamesPrefix = chainUuid => `${SchemaRdb.resultTablePrefix}_${chainUuid}`

export const getViewName = (chainUuid, stepUuid) => `${getViewNamesPrefix(chainUuid)}_${stepUuid}`

export const colNames = {
  parentUuid: 'parent_uuid',
}
