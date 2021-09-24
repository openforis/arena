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

    const survey = await this.fetchSurvey()

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
        await SurveyRdbManager.createDataView({ survey, nodeDef }, tx)
        this.logDebug(`create data table ${nodeDefName} - end`)

        // ===== insert into table
        this.logDebug(`insert into table ${nodeDefName} - start`)
        await SurveyRdbManager.populateTable(survey, nodeDef, tx)
        this.logDebug(`insert into table ${nodeDefName} - end`)

        this.incrementProcessedItems()
      },
      () => this.isCanceled()
    )

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
    const surveySummary = await SurveyManager.fetchSurveyById({ surveyId, draft: true }, tx)
    const surveyInfo = Survey.getSurveyInfo(surveySummary)
    const fetchDraft = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

    return SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId({ surveyId, draft: fetchDraft }, tx)
  }
}

SurveyRdbDataTablesAndViewsCreationJob.type = 'SurveyRdbDataTablesAndViewsCreationJob'
