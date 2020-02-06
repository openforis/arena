import * as R from 'ramda'

import Job from '@server/job/job'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as ResultStepView from '@common/surveyRdb/resultStepView'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'
import * as ProcessingChainManager from '@server/modules/analysis/manager/processingChainManager'

export default class SurveyRdbDataTablesAndViewsCreationJob extends Job {
  constructor(params) {
    super(SurveyRdbDataTablesAndViewsCreationJob.type, params)
  }

  async execute() {
    const { tx } = this

    const survey = await this.fetchSurvey()

    const resultViewsInfoByEntityUuid = await this._getResultViewsInfoByEntityUuid(survey)

    // Get entities or multiple attributes tables
    const { root, length } = Survey.getHierarchy(NodeDef.isEntityOrMultiple, true)(survey)

    this.total = length + 3

    // Traverse entities to create and populate tables
    const traverseNodeDef = async nodeDef => {
      if (this.isCanceled()) {
        return
      }

      const nodeDefName = NodeDef.getName(nodeDef)
      const resultViewInfo = resultViewsInfoByEntityUuid[NodeDef.getUuid(nodeDef)]

      // ===== create table
      this.logDebug(`create data table ${nodeDefName} - start`)
      await SurveyRdbManager.createTableAndView(survey, nodeDef, resultViewInfo, tx)
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

  async _getResultViewsInfoByEntityUuid(survey) {
    const { surveyId, tx } = this

    const resultViewsInfoByEntityUuid = {}
    const chains = await ProcessingChainManager.fetchChainsBySurveyId(surveyId, null, 0, null, tx)
    for (const chain of chains) {
      const steps = await ProcessingChainManager.fetchStepsAndCalculationsByChainUuid(
        surveyId,
        ProcessingChain.getUuid(chain),
        tx,
      )
      for (const step of steps) {
        if (ProcessingStep.hasEntity(step)) {
          const viewName = ResultStepView.getViewName(ProcessingStep.getUuid(step))
          const nodeDefsCalculation = R.pipe(
            ProcessingStep.getCalculations,
            R.map(
              R.pipe(ProcessingStepCalculation.getNodeDefUuid, nodeDefUuid =>
                Survey.getNodeDefByUuid(nodeDefUuid)(survey),
              ),
            ),
          )(step)

          resultViewsInfoByEntityUuid[ProcessingStep.getEntityUuid(step)] = {
            viewName,
            nodeDefsCalculation,
          }
        }
      }
    }

    return resultViewsInfoByEntityUuid
  }
}

SurveyRdbDataTablesAndViewsCreationJob.type = 'SurveyRdbDataTablesAndViewsCreationJob'
