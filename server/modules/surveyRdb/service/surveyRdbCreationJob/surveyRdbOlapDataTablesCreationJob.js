import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as PromiseUtils from '@core/promiseUtils'
import * as Chain from '@common/analysis/chain'

import Job from '@server/job/job'
import * as ChainManager from '@server/modules/analysis/manager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

export default class SurveyRdbOlapDataTablesCreationJob extends Job {
  constructor(params) {
    super(SurveyRdbOlapDataTablesCreationJob.type, params)
    // internal variables
    this.survey = null
    this.chain = null
    this.baseUnitDef = null
  }

  async onStart() {
    await super.onStart()

    const { surveyId, tx } = this
    this.survey = await this.fetchSurvey()

    const chains = await ChainManager.fetchChains({ surveyId }, tx)
    this.chain = chains.find(Chain.hasSamplingDesign)

    const { chain, survey } = this

    this.baseUnitDef = chain ? Survey.getBaseUnitNodeDef({ chain })(survey) : null
  }

  async execute() {
    const { survey, surveyId, baseUnitDef, tx } = this

    const cycles = Survey.getCycleKeys(survey)

    // drop existing tables
    await SurveyRdbManager.dropOlapDataTablesAndViews(surveyId, tx)

    // Get multiple entity definitions
    const descendantMultipleDefs = Survey.findDescendants({
      filterFn: (nodeDef) => NodeDef.isRoot(nodeDef) || NodeDef.isMultipleEntity(nodeDef),
    })(survey)

    this.total = descendantMultipleDefs.length * cycles.length

    // Visit entities to create tables
    // (break the loop if job is canceled)
    const stopIfFunction = () => this.isCanceled()

    await PromiseUtils.each(
      cycles,
      async (cycle) => {
        await PromiseUtils.each(
          // TODO generate only reporting tables
          descendantMultipleDefs,
          async (entityDef) => {
            this.logDebug(`create OLAP table for entity def ${NodeDef.getName(entityDef)}`)
            await SurveyRdbManager.createOlapDataTable({ survey, cycle, baseUnitDef, entityDef }, tx)
            this.incrementProcessedItems()
          },
          stopIfFunction
        )
      },
      stopIfFunction
    )
  }

  async fetchSurvey() {
    const { surveyId, tx } = this
    const surveySummary = await SurveyManager.fetchSurveyById({ surveyId, draft: true }, tx)
    const surveyInfo = Survey.getSurveyInfo(surveySummary)
    const fetchDraft = Survey.isFromCollect(surveyInfo) && !Survey.isPublished(surveyInfo)

    return SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(
      { surveyId, draft: fetchDraft, advanced: true, includeBigCategories: false, includeBigTaxonomies: false },
      tx
    )
  }
}

SurveyRdbOlapDataTablesCreationJob.type = 'SurveyRdbOlapDataTablesCreationJob'
