import * as PromiseUtils from '@core/promiseUtils'
import * as ApiRoutes from '@common/apiRoutes'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
// import * as Node from '@core/record/node'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as ResultNodeTable from '@common/surveyRdb/resultNodeTable'
// import * as ResultStepView from '@common/surveyRdb/resultStepView'

import * as RDBDataTable from '@server/modules/surveyRdb/schemaRdb/dataTable'
import * as RDBDataView from '@server/modules/surveyRdb/schemaRdb/dataView'
// import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'

import RFileSystem from './rFileSystem'
// import * as RFileReadData from './rFileReadData'

import { dfVar, setVar, dirCreate, writeCsv, arenaPutFile, zipr, unlink } from '../../rFunctions'

// const dfRes = 'res'
//
// const _resultTableColNamesVector = `c(${R.pipe(
//   R.values,
//   R.map((colName) => `'${colName}'`)
// )(ResultNodeTable.colNames)})`

function* persistResults(rFilePersistResults) {
  const { rChain } = rFilePersistResults
  const { chain, chainUuid, survey, surveyId } = rChain
  const steps = ProcessingChain.getProcessingSteps(chain).filter(ProcessingStep.hasEntity)

  // create results dir
  const dirResults = 'system/results'
  yield rFilePersistResults.appendContent(dirCreate(dirResults))

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i]
    const stepIndex = ProcessingStep.getIndex(step) + 1
    const stepUuid = ProcessingStep.getUuid(step)
    const entityDefStep = Survey.getNodeDefByUuid(ProcessingStep.getEntityUuid(step))(survey)
    const calculations = ProcessingStep.getCalculations(step)
    yield rFilePersistResults.logInfo(`'Persist results for step ${stepIndex} (start)'`)

    // data frame result columns - only output attribute values
    const dfResultColumns = calculations.reduce((columnsAggregator, calculation) => {
      const nodeDefCalculation = Survey.getNodeDefByUuid(ProcessingStepCalculation.getNodeDefUuid(calculation))(survey)
      const nodeDefCalculationName = NodeDef.getName(nodeDefCalculation)
      columnsAggregator.push(
        `'${nodeDefCalculationName}'`,
        `'${nodeDefCalculationName}_${ResultNodeTable.colNames.nodeDefUuid}'`
      )
      return columnsAggregator
    }, [])

    // create data frame result
    const dfSource = NodeDef.getName(entityDefStep)
    const dfResult = `${NodeDef.getName(entityDefStep)}Result`

    yield rFilePersistResults.appendContent(setVar(dfResult, `${dfSource}[, c(${dfResultColumns.join(',')})]`))

    // add uuids
    const uuidsMapping = [
      { name: ResultNodeTable.colNames.processingChainUuid, value: `'${chainUuid}'` },
      { name: ResultNodeTable.colNames.processingStepUuid, value: `'${stepUuid}'` },
      { name: ResultNodeTable.colNames.recordUuid, value: dfVar(dfSource, RDBDataTable.colNameRecordUuuid) },
      { name: ResultNodeTable.colNames.parentUuid, value: dfVar(dfSource, RDBDataView.getColUuid(entityDefStep)) },
    ]
    for (let j = 0; j < uuidsMapping.length; j += 1) {
      const uuidMapping = uuidsMapping[j]
      yield rFilePersistResults.appendContent(setVar(dfVar(dfResult, uuidMapping.name), uuidMapping.value))
    }

    // TODO
    // For code attributes, write res$[node_def_name] in json {itemUuid, code, label}
    // for (let j = 0; j < calculations.length; j += 1) {
    //   const calculation = calculations[j]
    //   const nodeDefCalculation = Survey.getNodeDefByUuid(ProcessingStepCalculation.getNodeDefUuid(calculation))(survey)
    //   const nodeDefCalculationName = NodeDef.getName(nodeDefCalculation)
    //   if(NodeDef.isCode(nodeDefCalculation)){
    //     withDF(dfResult, ifElse(isNa(nodeDefCalculationName), NA, ))
    //
    //   }
    //
    //   const value = `with(${dfResult},
    //     ifelse(is.na(${nodeDefCalcName}), ${NA}, ` +
    //     `sprintf('{"${Node.valuePropKeys.itemUuid}": "%s", "code": "%s", "label": "%s"}', ` +
    //     `${nodeDefCalcName}_item_uuid, ${nodeDefCalcName}, ${nodeDefCalcName}_item_label)))`
    // }

    // write csv file
    const fileResults = `${dirResults}/${dfSource}.csv`
    yield rFilePersistResults.appendContent(writeCsv(dfSource, fileResults))

    // create zip file
    const fileZip = `${dirResults}/${dfSource}.zip`
    yield rFilePersistResults.appendContent(zipr(fileZip, fileResults))

    // persist results
    yield rFilePersistResults.appendContent(arenaPutFile(ApiRoutes.rChain.stepEntityData(surveyId, stepUuid), fileZip))

    // rFilePersistResults.appendContent(arenaPutFile)

    yield rFilePersistResults.logInfo(`'Persist results for step ${stepIndex} (end)'`)
  }

  // remove results dir
  yield rFilePersistResults.appendContent(unlink(dirResults))
}

export default class RFilePersistResults extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'persist-results')
  }

  async init() {
    await super.init()

    // const { chain, survey } = this.rChain
    // const steps = ProcessingChain.getProcessingSteps(chain)

    await PromiseUtils.resolveGenerator(persistResults(this))

    // await this.appendContent(comment())
    //
    // await Promise.all(
    //   steps.map(async (step) => {
    //     if (ProcessingStep.hasEntity(step)) {
    //       const stepIndex = ProcessingStep.getIndex(step) + 1
    //       await this.logInfo(`'Persist results for step ${stepIndex} (start)'`)
    //
    //       const calculations = ProcessingStep.getCalculations(step)
    //       await Promise.all(calculations.map((calculation) => this._writeResultNodes(step, calculation)))
    //
    //       await this.logInfo(`'Persist results for step ${stepIndex} (end)'`)
    //     }
    //   })
    // )
    //
    // // Refresh materialized views
    // const resultStepViewsByEntityUuid = await SurveyRdbManager.generateResultViews(Survey.getId(survey))
    // const refreshMaterializedViewQueries = R.pipe(
    //   R.values,
    //   R.flatten,
    //   R.map((view) => dbSendQuery(`REFRESH MATERIALIZED VIEW \\"${ResultStepView.getViewName(view)}\\"`))
    // )(resultStepViewsByEntityUuid)
    //
    // await this.logInfo(`'Refresh result step materialized views'`)
    // await this.appendContent(...refreshMaterializedViewQueries)
    //
    // return this
  }

  // async _writeResultNodes(step, calculation) {
  //   const { chain, survey } = this.rChain
  //   const chainUuid = ProcessingChain.getUuid(chain)
  //
  //   const entityDefStep = R.pipe(ProcessingStep.getEntityUuid, (entityUuid) =>
  //     Survey.getNodeDefByUuid(entityUuid)(survey)
  //   )(step)
  //
  //   const dfSource = NodeDef.getName(entityDefStep)
  //
  //   const calculationIndex = ProcessingStepCalculation.getIndex(calculation)
  //   await this.logInfo(`'Persist results for calculation ${calculationIndex + 1}'`)
  //
  //   const nodeDefCalculationUuid = ProcessingStepCalculation.getNodeDefUuid(calculation)
  //   const nodeDefCalculation = Survey.getNodeDefByUuid(nodeDefCalculationUuid)(survey)
  //   const nodeDefCalcName = NodeDef.getName(nodeDefCalculation)
  //   if (NodeDef.isCode(nodeDefCalculation)) {
  //     // Join with category items data frame to add item_uuid, label
  //     const category = R.pipe(NodeDef.getCategoryUuid, (categoryUuid) =>
  //       Survey.getCategoryByUuid(categoryUuid)(survey)
  //     )(nodeDefCalculation)
  //     const dfCategoryItems = RFileReadData.getDfCategoryItems(category)
  //     await this.appendContent(
  //       comment(`Join ${dfSource} with category items data frame`),
  //       setVar(dfRes, merge(dfSource, dfCategoryItems, nodeDefCalcName, true))
  //     )
  //   } else {
  //     await this.appendContent(setVar(dfRes, dfSource))
  //   }
  //
  //   await this.appendContent(
  //     // Common part
  //     setVar(dfVar(dfRes, ResultNodeTable.colNames.processingChainUuid), `'${chainUuid}'`),
  //     setVar(dfVar(dfRes, ResultNodeTable.colNames.processingStepUuid), `'${ProcessingStep.getUuid(step)}'`),
  //     setVar(dfVar(dfRes, ResultNodeTable.colNames.recordUuid), dfVar(dfSource, RDBDataTable.colNameRecordUuuid)),
  //     setVar(dfVar(dfRes, ResultNodeTable.colNames.parentUuid), dfVar(dfSource, RDBDataView.getColUuid(entityDefStep))),
  //     // Calculation attribute part
  //     setVar(dfVar(dfRes, ResultNodeTable.colNames.uuid), dfVar(dfSource, `${nodeDefCalcName}_uuid`)),
  //     setVar(dfVar(dfRes, ResultNodeTable.colNames.nodeDefUuid), `'${nodeDefCalculationUuid}'`),
  //     '# Write res$value in json. For code attributes: {"itemUuid": ..., "code": ..., "label": ...}',
  //     setVar(
  //       dfVar(dfRes, ResultNodeTable.colNames.value),
  //       NodeDef.isCode(nodeDefCalculation)
  //         ? `with(${dfRes}, ifelse(is.na(${nodeDefCalcName}), ${NA}, ` +
  //             `sprintf('{"${Node.valuePropKeys.itemUuid}": "%s", "code": "%s", "label": "%s"}', ` +
  //             `${nodeDefCalcName}_item_uuid, ${nodeDefCalcName}, ${nodeDefCalcName}_item_label)))`
  //         : dfVar(dfRes, nodeDefCalcName)
  //     ),
  //     // Reorder result columns before writing into table
  //     setVar(dfRes, `${dfRes}[${_resultTableColNamesVector}]`),
  //     dbWriteTable(ResultNodeTable.tableName, dfRes, true)
  //   )
  // }
}
