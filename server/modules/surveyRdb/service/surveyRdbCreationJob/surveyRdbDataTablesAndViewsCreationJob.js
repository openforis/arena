import { SRSs } from '@openforis/arena-core'

import Job from '../../../../job/job'

import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'
import * as PromiseUtils from '../../../../../core/promiseUtils'

import * as SurveyRdbManager from '../../manager/surveyRdbManager'
import * as SurveyManager from '../../../survey/manager/surveyManager'

export default class SurveyRdbDataTablesAndViewsCreationJob extends Job {
  constructor(params) {
    super(SurveyRdbDataTablesAndViewsCreationJob.type, params)
  }

  async execute() {
    const { tx } = this

    // initialize SRSs
    await SRSs.init()

    const survey = await this.fetchSurvey()
    const surveyInfo = Survey.getSurveyInfo(survey)
    const surveyId = Survey.getId(survey)
    const surveyName = Survey.getName(surveyInfo)

    const jobDescription = `RDB tables and views creation for survey ${surveyId} (${surveyName})`
    this.logDebug(`${jobDescription} - start`)

    // Get entities or multiple attributes tables
    const descendantMultipleDefs = Survey.findDescendants({
      filterFn: (nodeDef) => NodeDef.isRoot(nodeDef) || NodeDef.isMultiple(nodeDef),
    })(survey)

    this.total = descendantMultipleDefs.length + 3

    // Visit entities and multiple attributes to create and populate tables
    await PromiseUtils.each(
      descendantMultipleDefs,
      async (nodeDef) => {
        const nodeDefName = NodeDef.getName(nodeDef)

        // ===== create table and view
        this.logDebug(`create data table ${nodeDefName} - start`)
        await SurveyRdbManager.createDataTable({ survey, nodeDef }, tx)
        this.logDebug(`create data table ${nodeDefName} - end`)

        // ===== insert into table
        this.logDebug(`insert into table ${nodeDefName} - start`)
        await SurveyRdbManager.populateTable(survey, nodeDef, tx)
        this.logDebug(`insert into table ${nodeDefName} - end`)

        this.incrementProcessedItems()
      },
      () => this.isCanceled()
    )
    // create views
    await PromiseUtils.each(descendantMultipleDefs, async (nodeDef) => {
      const nodeDefName = NodeDef.getName(nodeDef)
      this.logDebug(`create view for ${nodeDefName} - start`)
      await SurveyRdbManager.createDataView({ survey, nodeDef }, tx)
      this.logDebug(`create view for ${nodeDefName} - end`)
    })

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

    this.logDebug(`${jobDescription} - end`)
  }

  async fetchSurvey() {
    const { surveyId, tx } = this
    const surveySummary = await SurveyManager.fetchSurveyById({ surveyId, draft: true }, tx)
    const surveyInfo = Survey.getSurveyInfo(surveySummary)
    const fetchDraft = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

    return SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({ surveyId, draft: fetchDraft }, tx)
  }
}

SurveyRdbDataTablesAndViewsCreationJob.type = 'SurveyRdbDataTablesAndViewsCreationJob'
