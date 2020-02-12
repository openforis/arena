import * as R from 'ramda'

import * as ResultNodeTable from '@common/surveyRdb/resultNodeTable'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as ResultStepView from '@common/surveyRdb/resultStepView'

import * as RDBDataTable from '@server/modules/surveyRdb/schemaRdb/dataTable'
import * as RDBDataView from '@server/modules/surveyRdb/schemaRdb/dataView'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'
import { RFileSystem } from '@server/modules/analysis/service/_rChain/rFile'
import {
  dbWriteTable,
  dfVar,
  setVar,
  dbSendQuery,
  merge,
  NA,
} from '@server/modules/analysis/service/_rChain/rFunctions'

import * as RFileReadData from './rFileReadData'

const dfRes = 'res'

const _resultTableColNamesVector = `c(${R.pipe(
  R.values,
  R.map(colName => `'${colName}'`),
)(ResultNodeTable.colNames)})`

export default class RFilePersistResults extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'persist-results')
  }

  async init() {
    await super.init()

    const { chain, survey } = this.rChain

    const steps = ProcessingChain.getProcessingSteps(chain)

    for (const step of steps) {
      if (ProcessingStep.hasEntity(step)) {
        const stepIndex = ProcessingStep.getIndex(step) + 1
        await this.logInfo(`'Persist results for step ${stepIndex} (start)'`)

        for (const calculation of ProcessingStep.getCalculations(step)) {
          await this._writeResultNodes(step, calculation)
        }

        await this.logInfo(`'Persist results for step ${stepIndex} (end)'`)
      }
    }

    // Refresh materialized views
    const resultStepViewsByEntityUuid = await SurveyRdbManager.generateResultViews(Survey.getId(survey))
    const refreshMaterializedViewQueries = R.pipe(
      R.values,
      R.flatten,
      R.map(view => dbSendQuery(`REFRESH MATERIALIZED VIEW \\"${ResultStepView.getViewName(view)}\\"`)),
    )(resultStepViewsByEntityUuid)

    await this.logInfo(`'Refresh result step materialized views'`)
    await this.appendContent(...refreshMaterializedViewQueries)

    return this
  }

  async _writeResultNodes(step, calculation) {
    const { chain, survey } = this.rChain
    const chainUuid = ProcessingChain.getUuid(chain)

    const entityDefStep = R.pipe(ProcessingStep.getEntityUuid, entityUuid =>
      Survey.getNodeDefByUuid(entityUuid)(survey),
    )(step)

    const dfSource = NodeDef.getName(entityDefStep)

    const calculationIndex = ProcessingStepCalculation.getIndex(calculation)
    await this.logInfo(`'Persist results for calculation ${calculationIndex + 1}'`)

    const nodeDefCalculationUuid = ProcessingStepCalculation.getNodeDefUuid(calculation)
    const nodeDefCalculation = Survey.getNodeDefByUuid(nodeDefCalculationUuid)(survey)
    const nodeDefCalcName = NodeDef.getName(nodeDefCalculation)
    if (NodeDef.isCode(nodeDefCalculation)) {
      // Join with category items data frame to add item_uuid, label
      const category = R.pipe(NodeDef.getCategoryUuid, categoryUuid => Survey.getCategoryByUuid(categoryUuid)(survey))(
        nodeDefCalculation,
      )
      const dfCategoryItems = RFileReadData.getDfCategoryItems(category)
      await this.appendContent(
        `# Join ${dfSource} with category items data frame`,
        setVar(dfRes, merge(dfSource, dfCategoryItems, nodeDefCalcName, true)),
      )
    } else {
      await this.appendContent(setVar(dfRes, dfSource))
    }

    await this.appendContent(
      // Common part
      setVar(dfVar(dfRes, ResultNodeTable.colNames.processingChainUuid), `'${chainUuid}'`),
      setVar(dfVar(dfRes, ResultNodeTable.colNames.processingStepUuid), `'${ProcessingStep.getUuid(step)}'`),
      setVar(dfVar(dfRes, ResultNodeTable.colNames.recordUuid), dfVar(dfSource, RDBDataTable.colNameRecordUuuid)),
      setVar(dfVar(dfRes, ResultNodeTable.colNames.parentUuid), dfVar(dfSource, RDBDataView.getColUuid(entityDefStep))),
      // Calculation attribute part
      setVar(dfVar(dfRes, ResultNodeTable.colNames.uuid), dfVar(dfSource, `${nodeDefCalcName}_uuid`)),
      setVar(dfVar(dfRes, ResultNodeTable.colNames.nodeDefUuid), `'${nodeDefCalculationUuid}'`),
      '# Write res$value in json. For code attributes: {"itemUuid": ..., "code": ..., "label": ...}',
      setVar(
        dfVar(dfRes, ResultNodeTable.colNames.value),
        NodeDef.isCode(nodeDefCalculation)
          ? `with(${dfRes}, ifelse(is.na(${nodeDefCalcName}), ${NA}, ` +
              `sprintf('{"${Node.valuePropKeys.itemUuid}": "%s", "code": "%s", "label": "%s"}', ` +
              `${nodeDefCalcName}_item_uuid, ${nodeDefCalcName}, ${nodeDefCalcName}_item_label)))`
          : dfVar(dfRes, nodeDefCalcName),
      ),
      // Reorder result columns before writing into table
      setVar(dfRes, `${dfRes}[${_resultTableColNamesVector}]`),
      dbWriteTable(ResultNodeTable.tableName, dfRes, true),
    )
  }
}
