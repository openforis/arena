import * as NodeDef from '@core/survey/nodeDef'

import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import * as DataTable from './dataTable'

/**
 * @deprecated - Use ViewDataNodeDef.
 */
export const getName = NodeDefTable.getViewName
// eslint-disable-next-line
/**
 * @deprecated - Use ViewDataNodeDef.
 */
export const getNameWithSchema = (surveyId) => (nodeDef) =>
  `${SchemaRdb.getName(surveyId)}.${NodeDefTable.getViewName(nodeDef)}`

// eslint-disable-next-line
/**
 * @deprecated - Use ViewDataNodeDef.
 */
export const alias = 'a'

// eslint-disable-next-line
/**
 * @deprecated - Use ViewDataNodeDef.
 */
export const columns = {
  keys: '_keys',
}
// eslint-disable-next-line
/**
 * @deprecated - Use ViewDataNodeDef.
 */
export const getColUuid = (nodeDef) => `${NodeDef.getName(nodeDef)}_${DataTable.columnNameUuid}`
