import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import * as DataTable from './dataTable'
import * as DataCol from './dataCol'

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
export const aliasParent = 'p'

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
export const getColUuid = (nodeDef) => `${NodeDef.getName(nodeDef)}_${DataTable.colNameUuuid}`

/**
 * Returns the list of column names relative to the specified node def hierarchy.
 *
 * @deprecated - Use ViewDataNodeDef.
 *
 * @param {!object} survey - The survey.
 * @param {!object} nodeDef - The context node definition.
 * @param {boolean} [fromDataTable=false] - If false, the columns returned belong to the data view, otherwise from data table and include the alias.
 * @returns {Array} - List of column names.
 */
export const getNodeDefColumnNames = (survey, nodeDef, fromDataTable = false) => {
  const colNames = []

  Survey.visitAncestorsAndSelf(nodeDef, (nodeDefCurrent) => {
    const isSelf = NodeDef.isEqual(nodeDefCurrent)(nodeDef)
    const colUuid = getColUuid(nodeDefCurrent)
    const nodeDefColumnNames = R.pipe(
      DataTable.getNodeDefColumns,
      R.map(DataCol.getNames),
      R.flatten,
      R.when(
        R.always(fromDataTable),
        R.map((colName) => `${isSelf ? alias : aliasParent}.${colName}`)
      ),
      R.ifElse(
        R.always(fromDataTable),
        R.prepend(isSelf ? `${alias}.${DataTable.colNameUuuid} AS ${colUuid}` : `${aliasParent}.${colUuid}`),
        R.prepend(colUuid)
      )
    )(survey, nodeDefCurrent)
    colNames.unshift(...nodeDefColumnNames)
  })(survey)

  return colNames
}
