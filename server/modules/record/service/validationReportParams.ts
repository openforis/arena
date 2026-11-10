import { Authorizer, Survey as SurveyType, User } from '@openforis/arena-core'

import { Query } from '@common/model/query'
import { TableDataNodeDef, ViewDataNodeDef } from '@common/model/db'
import * as Survey from '@core/survey/survey'
import * as UserUtils from '@core/user/user'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

const { columnSet } = TableDataNodeDef

type ValidationReportFilterParams = {
  query?: unknown
  attributeDefUuids?: string[] | null
  messageTypeKeys?: string[] | null
}

const _buildFilterBySurveyAttrs = ({
  rootDataView,
  query,
  attributeDefUuids = null,
  messageTypeKeys = null,
}: ValidationReportFilterParams & { rootDataView: ViewDataNodeDef }): Record<string, unknown> | null => {
  const filter = query ? Query.getFilter(query) : null
  const hasAttributeFilter = Array.isArray(attributeDefUuids)
  const hasMessageTypeFilter = Array.isArray(messageTypeKeys)
  if (!filter && !hasAttributeFilter && !hasMessageTypeFilter) return null

  return {
    ...(filter
      ? {
          filter,
          // the filter (sent by the client) can reference only the root data view columns
          filterColumnNames: [
            ...TableDataNodeDef.rootDefColumnNames,
            columnSet.dateCreated,
            columnSet.dateModified,
            ...rootDataView.columnNodeDefNames,
          ],
        }
      : {}),
    ...(hasAttributeFilter ? { attributeDefUuids } : {}),
    ...(hasMessageTypeFilter ? { messageTypeKeys } : {}),
  }
}

const _buildRecordAccessFilters = async ({ user, survey }: { user: User; survey: SurveyType }) => {
  const canViewNotOwnedRecords = Authorizer.canViewNotOwnedRecords(user, Survey.getSurveyInfo(survey))
  const { own, readable } = await SurveyManager.fetchUserGroupAccessFilters({ user, survey })
  return {
    ownerUuid: canViewNotOwnedRecords ? null : UserUtils.getUuid(user),
    qualifierNodeDefFilters: own,
    readableQualifierNodeDefFilterSets: readable,
  }
}

/**
 * Resolves the params of the validation report queries: the filters selected by the user and the restrictions
 * on the records the user can read (owner and user group qualifiers).
 * @param {object} params - The parameters.
 * @param {User} params.user - The user requesting the report.
 * @param {number} params.surveyId - The survey id.
 * @param {string} params.cycle - The survey cycle.
 * @param {object} [params.query] - The query with the records filter expression.
 * @param {string[]} [params.attributeDefUuids] - Uuids of the attribute defs to include.
 * @param {string[]} [params.messageTypeKeys] - Validation message keys to include.
 * @returns {Promise<object>} - The survey, the root data view name, filterBySurveyAttrs and recordAccessFilters.
 */
export const resolveValidationReportParams = async ({
  user,
  surveyId,
  cycle,
  ...filterParams
}: ValidationReportFilterParams & { user: User; surveyId: number; cycle: string }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })
  const rootDataView = new ViewDataNodeDef(survey, Survey.getNodeDefRoot(survey))
  return {
    survey,
    rootDataViewName: rootDataView.name,
    filterBySurveyAttrs: _buildFilterBySurveyAttrs({ rootDataView, ...filterParams }),
    recordAccessFilters: await _buildRecordAccessFilters({ user, survey }),
  }
}
