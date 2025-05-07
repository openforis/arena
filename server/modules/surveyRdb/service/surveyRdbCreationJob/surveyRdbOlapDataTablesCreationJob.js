import { Objects } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as PromiseUtils from '@core/promiseUtils'

import * as Chain from '@common/analysis/chain'
import TableOlapData from '@common/model/db/tables/olapData/table'

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

  async shouldExecute() {
    const { surveyId, chain, context, tx } = this
    const { surveyPublishedPrevious } = context

    if (!(await SurveyRdbManager.selectOlapDataTablesExists(surveyId, tx))) {
      this.logDebug('OLAP tables creation needed (tables not created yet)')
      return true
    }

    if (!surveyPublishedPrevious) {
      this.logDebug('OLAP tables creation needed (survey not published yet)')
      return true
    }
    const surveySummary = await SurveyManager.fetchSurveyById({ surveyId, draft: true }, tx)
    const surveyInfo = Survey.getSurveyInfo(surveySummary)
    if (!Survey.isPublished(surveyInfo)) {
      this.logDebug('OLAP tables creation not needed (survey not published yet)')
      return false
    }
    const surveyNext = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
      { surveyId, advanced: true, includeAnalysis: true },
      tx
    )
    // check if cycles changed
    const cyclesNext = Survey.getCycleKeys(surveyNext)
    const cyclesPrev = Survey.getCycleKeys(surveyPublishedPrevious)
    if (!Objects.isEqual(cyclesNext, cyclesPrev)) {
      this.logDebug('OLAP tables creation needed (survey cycles changed)')
      return true
    }

    // check if base unit name changed
    const baseUnitDefNext = Survey.getBaseUnitNodeDef({ chain })(surveyNext)
    const baseUnitDefPrev = Survey.getBaseUnitNodeDef({ chain })(surveyPublishedPrevious)

    if (NodeDef.getName(baseUnitDefNext) !== NodeDef.getName(baseUnitDefPrev)) {
      this.logDebug('OLAP tables creation needed (base unit changed)')
      return true
    }

    const entityDefsNext = Survey.getOlapDataTableEntityDefs(surveyNext)
    const entityDefsPrev = Survey.getOlapDataTableEntityDefs(surveyPublishedPrevious)

    if (entityDefsNext.length !== entityDefsPrev.length) {
      this.logDebug('OLAP tables creation needed (at least one multiple entity definition changed)')
      return true
    }

    for await (const cycle of cyclesPrev) {
      let entityDefIndex = 0
      for await (const entityDefNext of entityDefsNext) {
        const entityDefPrev = entityDefsPrev[entityDefIndex]
        const tableNext = new TableOlapData({
          survey: surveyNext,
          cycle,
          baseUnitDef: baseUnitDefNext,
          entityDef: entityDefNext,
        })
        const tablePrev = new TableOlapData({
          survey: surveyPublishedPrevious,
          cycle,
          baseUnitDef: baseUnitDefPrev,
          entityDef: entityDefPrev,
        })
        if (tableNext.name !== tablePrev.name || !Objects.isEqual(tableNext.columnNames, tablePrev.columnNames)) {
          this.logDebug(
            `OLAP tables craetion needed (one of the tables changed: ${tableNext.name}/${tablePrev.name} - ${tableNext.columnNames}/${tablePrev.columnNames})`
          )
          return true
        }
        entityDefIndex += 1
      }
    }
    return false
  }

  async execute() {
    const { survey, surveyId, chain, baseUnitDef, tx } = this

    const cycles = Survey.getCycleKeys(survey)

    // drop existing tables
    await SurveyRdbManager.dropOlapDataTablesAndViews(surveyId, tx)

    if (!chain || !baseUnitDef) {
      // do not create tables
      return
    }

    // Get multiple entity definitions
    const entityDefs = Survey.getOlapDataTableEntityDefs(survey)

    this.total = entityDefs.length * cycles.length

    // Visit entities to create tables
    // (break the loop if job is canceled)
    const stopIfFunction = () => this.isCanceled()

    await PromiseUtils.each(
      cycles,
      async (cycle) => {
        await PromiseUtils.each(
          // TODO generate only reporting tables
          entityDefs,
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
