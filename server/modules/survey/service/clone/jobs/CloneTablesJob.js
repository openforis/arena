import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as ActivityLog from '@common/activityLog/activityLog'

const tablesDraftInfo = [
  { table: 'category' },
  { table: 'category_level' },
  { table: 'category_item' },
  { table: 'taxonomy' },
  { table: 'taxon' },
  { table: 'taxon_vernacular_name' },
  { table: 'node_def' },
  { table: 'chain' },
  { table: 'chain_node_def' },
  { table: 'chain_node_def_aggregate' },
]

const isPublishedCondition = `props::text <> '{}'::text`

const tablesPublishedInfo = [
  { table: 'category', excludeColumns: ['props_draft'], filterRowsCondition: isPublishedCondition },
  { table: 'category_level', excludeColumns: ['props_draft'], filterRowsCondition: isPublishedCondition },
  { table: 'category_item', excludeColumns: ['props_draft'], filterRowsCondition: isPublishedCondition },
  { table: 'taxonomy', excludeColumns: ['props_draft'], filterRowsCondition: isPublishedCondition },
  { table: 'taxon', excludeColumns: ['props_draft'], filterRowsCondition: isPublishedCondition },
  {
    table: 'taxon_vernacular_name',
    excludeColumns: ['props_draft'],
    filterRowsCondition: isPublishedCondition,
  },
  {
    table: 'node_def',
    excludeColumns: ['props_draft', 'props_advanced_draft'],
    filterRowsCondition: isPublishedCondition,
  },
  { table: 'chain' },
  { table: 'chain_node_def' },
  { table: 'chain_node_def_aggregate' },
]

export default class CloneTablesJob extends Job {
  constructor(params) {
    super('CloneTablesJob', params)
  }

  async execute() {
    const { surveyIdSource, surveyInfoSource, surveyIdTarget, surveyInfoTarget, user } = this.context

    // if the source survey is a template, clone only published items, otherwise clone even draft ones
    const tablesInfo = Survey.isTemplate(surveyInfoSource) ? tablesPublishedInfo : tablesDraftInfo

    await Promise.all(
      tablesInfo.map(async ({ table, excludeColumns = [], filterRowsCondition = null }) =>
        SurveyManager.cloneTable(
          {
            surveyIdSource,
            surveyIdTarget,
            table,
            excludeColumns,
            filterRowsCondition,
          },
          this.tx
        )
      )
    )

    await ActivityLogRepository.insert(
      user,
      surveyIdTarget,
      ActivityLog.type.surveyCreate,
      surveyInfoTarget,
      false,
      this.tx
    )
  }
}
