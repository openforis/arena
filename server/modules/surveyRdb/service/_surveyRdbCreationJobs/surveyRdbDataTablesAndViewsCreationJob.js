import * as R from 'ramda'

import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'

export default class SurveyRdbDataTablesAndViewsCreationJob extends Job {
  constructor(params) {
    super(SurveyRdbDataTablesAndViewsCreationJob.type, params)
  }

  async execute() {
    const { surveyId, tx } = this

    const survey = await this.fetchSurvey()

    const resultStepViewsByEntityUuid = await SurveyRdbManager.generateResultViews(surveyId, tx)

    // Get entities or multiple attributes tables
    const { root, length } = Survey.getHierarchy(NodeDef.isEntityOrMultiple, true)(survey)

    this.total = length + 3

    // Traverse entities to create and populate tables
    const traverseNodeDef = async nodeDef => {
      if (this.isCanceled()) {
        return
      }

      const nodeDefName = NodeDef.getName(nodeDef)
      const resultStepViews = R.propOr([], NodeDef.getUuid(nodeDef), resultStepViewsByEntityUuid)

      // ===== create table
      this.logDebug(`create data table ${nodeDefName} - start`)
      await SurveyRdbManager.createTableAndView(survey, nodeDef, resultStepViews, tx)
      this.logDebug(`create data table ${nodeDefName} - end`)

      // ===== insert into table
      this.logDebug(`insert into table ${nodeDefName} - start`)
      await SurveyRdbManager.populateTable(survey, nodeDef, tx)
      this.logDebug(`insert into table ${nodeDefName} - end`)

      this.incrementProcessedItems()
    }

    await Survey.traverseHierarchyItem(root, traverseNodeDef)

    this.logDebug('create node keys view - start')
    await SurveyRdbManager.createNodeKeysView(survey, tx)
    this.incrementProcessedItems()
    this.logDebug('create node keys view - end')

    this.logDebug('create node hierarchy disaggregated view - start')
    await SurveyRdbManager.createNodeHierarchyDisaggregatedView(survey, tx)
    this.incrementProcessedItems()
    this.logDebug('create node hierarchy disaggregated view - end')

    this.logDebug('create node keys hierarchy view - start')
    await SurveyRdbManager.createNodeKeysHierarchyView(survey, tx)
    this.incrementProcessedItems()
    this.logDebug('create node keys hierarchy view - end')
  }

  async fetchSurvey() {
    const { surveyId, tx } = this
    const surveySummary = await SurveyManager.fetchSurveyById(surveyId, true, false, tx)
    const surveyInfo = Survey.getSurveyInfo(surveySummary)
    const fetchDraft = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

    return await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      surveyId,
      null,
      fetchDraft,
      false,
      false,
      false,
      tx,
    )
  }
}

SurveyRdbDataTablesAndViewsCreationJob.type = 'SurveyRdbDataTablesAndViewsCreationJob'
