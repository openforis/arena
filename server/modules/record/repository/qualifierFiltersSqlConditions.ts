import type { NodeDef, NodeDefType } from '@openforis/arena-core'

import * as NodeDefUtils from '@core/survey/nodeDef'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

// see SurveyManager.fetchUserGroupAccessFilters
export type QualifierFilter = { nodeDef: NodeDef<NodeDefType>; value: unknown }

export type QualifierFiltersSqlConditions = {
  // matches the records of the user's own group (null when the user is unrestricted)
  ownCondition: string | null
  // match the records of each group whose records the user's group can read
  readableConditions: string[]
  // matches the records the user can read: own group or readable groups (null when the user is unrestricted)
  condition: string | null
  params: Record<string, unknown>
}

/**
 * Builds the SQL conditions on the root entity qualifier columns restricting the records to the user group ones.
 * @param {object} params - The parameters.
 * @param {QualifierFilter[]} params.qualifierNodeDefFilters - Qualifier filters of the user's own group.
 * @param {QualifierFilter[][]} [params.readableQualifierNodeDefFilterSets] - Qualifier filters of the readable groups.
 * @param {string|null} [params.tableAlias] - Alias of the root entity table or view (columns are unqualified if null).
 * @returns {QualifierFiltersSqlConditions} - The conditions and their (named) params.
 */
export const buildQualifierFiltersSqlConditions = ({
  qualifierNodeDefFilters,
  readableQualifierNodeDefFilterSets = [],
  tableAlias = null,
}: {
  qualifierNodeDefFilters: QualifierFilter[]
  readableQualifierNodeDefFilterSets?: QualifierFilter[][]
  tableAlias?: string | null
}): QualifierFiltersSqlConditions => {
  const params: Record<string, unknown> = {}
  const columnPrefix = tableAlias ? `${tableAlias}.` : ''
  const buildFiltersCondition = (filters: QualifierFilter[], setIndex: number): string =>
    filters
      .map(({ nodeDef, value }, index) => {
        const paramName = `qualifierValue${setIndex}_${index}`
        const colName = NodeDefTable.getColumnName(nodeDef)
        params[paramName] = NodeDefUtils.isCode(nodeDef) ? (value as { code?: string } | null)?.code : value
        return `${columnPrefix}"${colName}" = $/${paramName}/`
      })
      .join(' AND ')

  const ownCondition = buildFiltersCondition(qualifierNodeDefFilters, 0)
  if (!ownCondition) {
    return { ownCondition: null, readableConditions: [], condition: null, params }
  }
  // readable groups' filters are relevant only when the user is restricted to its own group
  const readableConditions = readableQualifierNodeDefFilterSets.map((filters, index) =>
    buildFiltersCondition(filters, index + 1)
  )
  const condition = [ownCondition, ...readableConditions].map((cond) => `(${cond})`).join(' OR ')
  return { ownCondition, readableConditions, condition, params }
}
