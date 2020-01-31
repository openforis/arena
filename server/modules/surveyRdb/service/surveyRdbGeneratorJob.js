import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as SurveyManager from '../../survey/manager/surveyManager'

import * as SurveyRdbManager from '../manager/surveyRdbManager'

export default class SurveyRdbGeneratorJob extends Job {
  constructor(params) {
    super(SurveyRdbGeneratorJob.type, params)
  }

  async execute() {
    const { tx } = this
    const survey = await this.fetchSurvey(tx)
    const surveyId = Survey.getId(survey)

    // Get entities or multiple attributes tables
    const { root, length } = Survey.getHierarchy(NodeDef.isEntityOrMultiple, true)(survey)

    this.total = 1 + length + 4 // Create schema + create and populate tables + create node analysis table + create views

    this.logDebug('drop and create schema - start')

    // 1 ==== drop and create schema
    await SurveyRdbManager.dropSchema(surveyId, tx)
    await SurveyRdbManager.createSchema(surveyId, tx)
    this.incrementProcessedItems()
    this.logDebug('drop and create schema - end')

    // 2 ==== traverse entities to create and populate tables
    const traverseNodeDef = async nodeDef => {
      if (this.isCanceled()) {
        return
      }

      const nodeDefName = NodeDef.getName(nodeDef)

      // ===== create table
      this.logDebug(`create data table ${nodeDefName} - start`)
      await SurveyRdbManager.createTableAndView(survey, nodeDef, tx)
      this.logDebug(`create data table ${nodeDefName} - end`)

      // ===== insert into table
      this.logDebug(`insert into table ${nodeDefName} - start`)
      await SurveyRdbManager.populateTable(survey, nodeDef, tx)
      this.logDebug(`insert into table ${nodeDefName} - end`)

      this.incrementProcessedItems()
    }

    await Survey.traverseHierarchyItem(root, traverseNodeDef)

    // 3 ==== Create node analysis table
    await SurveyRdbManager.createNodeAnalysisTable(surveyId, tx)
    this.incrementProcessedItems()

    // 4 ==== Create views
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

  async fetchSurvey(tx) {
    const surveySummary = await SurveyManager.fetchSurveyById(this.surveyId, true, false, tx)
    const surveyInfo = Survey.getSurveyInfo(surveySummary)
    const fetchDraft = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

    return await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      this.surveyId,
      null,
      fetchDraft,
      false,
      false,
      false,
      tx,
    )
  }
}

SurveyRdbGeneratorJob.type = 'SurveyRdbGeneratorJob'
