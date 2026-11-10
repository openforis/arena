import { NodeDef, NodeDefType, Survey } from '@openforis/arena-core'

import * as StringUtils from '@core/stringUtils'
import * as NodeDefUtils from '@core/survey/nodeDef'
import * as SurveyUtils from '@core/survey/survey'

import { ViewDataNodeDef } from '@common/model/db'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

type QualifierFilter = { nodeDef: NodeDef<NodeDefType>; value: unknown }

// see SurveyManager.fetchUserGroupAccessFilters
export type UserGroupAccessFilters = {
  own: QualifierFilter[]
  readable: QualifierFilter[][]
}

type SqlCondition = { clause: string; params: Record<string, unknown> }

const rootViewAlias = '_user_group_access_root'

const buildQualifierFiltersCondition = ({
  filters,
  setIndex,
  params,
}: {
  filters: QualifierFilter[]
  setIndex: number
  params: Record<string, unknown>
}): string =>
  filters
    .map(({ nodeDef, value }, index) => {
      const paramName = `userGroupQualifier${setIndex}_${index}`
      // code attribute columns contain the item code
      params[paramName] = NodeDefUtils.isCode(nodeDef) ? (value as { code?: string } | null)?.code : value
      const columnName = StringUtils.quoteDouble(NodeDefTable.getColumnName(nodeDef))
      return `${rootViewAlias}.${columnName} = $/${paramName}/`
    })
    .join(' AND ')

/**
 * Builds the SQL condition restricting the rows of a data view to the records of the user's group
 * and of the groups whose records it can read, using the qualifier columns of the root entity data view
 * (same filters used for the records list, see RecordRepository.fetchRecordsSummaryBySurveyId).
 * @param params - The parameters.
 * @param params.survey - The survey.
 * @param params.accessFilters - The user group access filters (see SurveyManager.fetchUserGroupAccessFilters).
 * @param params.recordUuidColumn - The record UUID column of the queried data view (qualified if the view is aliased).
 * @returns The condition and its parameters, or null when the user is not restricted.
 */
export const getUserGroupAccessCondition = ({
  survey,
  accessFilters,
  recordUuidColumn,
}: {
  survey: Survey
  accessFilters: UserGroupAccessFilters | null
  recordUuidColumn: string
}): SqlCondition | null => {
  const { own = [], readable = [] } = accessFilters ?? {}
  // readable groups' filters are relevant only when the user is restricted to its own group
  if (own.length === 0) return null

  const params: Record<string, unknown> = {}
  const filterSetsConditions = [own, ...readable].map((filters, setIndex) =>
    buildQualifierFiltersCondition({ filters, setIndex, params })
  )
  const rootView = new ViewDataNodeDef(survey, SurveyUtils.getNodeDefRoot(survey))
  const clause = `${recordUuidColumn} IN (
    SELECT ${rootViewAlias}.${ViewDataNodeDef.columnSet.recordUuid}
    FROM ${rootView.nameQualified} AS ${rootViewAlias}
    WHERE ${filterSetsConditions.map((condition) => `(${condition})`).join(' OR ')}
  )`
  return { clause, params }
}
