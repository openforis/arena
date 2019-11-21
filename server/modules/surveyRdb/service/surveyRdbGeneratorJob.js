import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as SurveyManager from '../../survey/manager/surveyManager'

import * as SurveyRdbManager from '../manager/surveyRdbManager'

export default class SurveyRdbGeneratorJob extends Job {

  constructor (params) {
    super(SurveyRdbGeneratorJob.type, params)
  }

  async execute (tx) {

    const survey = await this.fetchSurvey(tx)
    const surveyId = Survey.getId(survey)

    //get entities or multiple attributes tables
    const { root, length } = Survey.getHierarchy(NodeDef.isEntityOrMultiple)(survey)

    this.total = 1 + length + 3 //create schema + create and populate tables + create views

    this.logDebug('drop and create schema - start')

    //1 ==== drop and create schema
    await SurveyRdbManager.dropSchema(surveyId, tx)
    await SurveyRdbManager.createSchema(surveyId, tx)
    this.incrementProcessedItems()
    this.logDebug('drop and create schema - end')

    //2 ==== traverse entities to create and populate tables
    const traverseNodeDef = async nodeDef => {
      if (this.isCanceled())
        return

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

    //3 ==== Create views
    this.logDebug(`create node keys view - start`)
    await SurveyRdbManager.createNodeKeysView(survey, tx)
    this.incrementProcessedItems()
    this.logDebug(`create node keys view - end`)

    this.logDebug(`create node hierarchy disaggregated view - start`)
    await SurveyRdbManager.createNodeHierarchyDisaggregatedView(survey, tx)
    this.incrementProcessedItems()
    this.logDebug(`create node hierarchy disaggregated view - end`)

    this.logDebug(`create node keys hierarchy view - start`)
    await SurveyRdbManager.createNodeKeysHierarchyView(survey, tx)
    this.incrementProcessedItems()
    this.logDebug(`create node keys hierarchy view - end`)

  }

  async fetchSurvey (tx) {
    const surveySummary = await SurveyManager.fetchSurveyById(this.surveyId, true, false, tx)
    const surveyInfo = Survey.getSurveyInfo(surveySummary)
    const fetchDraft = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

    return await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(this.surveyId, null, fetchDraft, false, false, false, tx)
  }

}

SurveyRdbGeneratorJob.type = 'SurveyRdbGeneratorJob'
