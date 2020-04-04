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

import { dfVar, setVar, dirCreate, writeCsv, arenaPutFile, zipr, unlink, vector } from '../../rFunctions'

function* initDfResult(dfSource, dfResult, step, entityDefStep) {
  const { survey, chainUuid } = this.rChain
  const stepUuid = ProcessingStep.getUuid(step)
  const calculations = ProcessingStep.getCalculations(step)

  // columns: only output attribute values
  const dfResultColumns = calculations.reduce((columnsAggregator, calculation) => {
    const nodeDefCalculation = Survey.getNodeDefByUuid(ProcessingStepCalculation.getNodeDefUuid(calculation))(survey)
    const nodeDefCalculationName = NodeDef.getName(nodeDefCalculation)
    columnsAggregator.push(
      `'${nodeDefCalculationName}'`,
      `'${nodeDefCalculationName}_${ResultNodeTable.colNames.nodeDefUuid}'`
    )
    return columnsAggregator
  }, [])
  const setDfResult = setVar(dfResult, `${dfSource}[, ${vector(dfResultColumns)}]`)

  // add uuids
  const setUuids = [
    { name: ResultNodeTable.colNames.processingChainUuid, value: `'${chainUuid}'` },
    { name: ResultNodeTable.colNames.processingStepUuid, value: `'${stepUuid}'` },
    { name: ResultNodeTable.colNames.recordUuid, value: dfVar(dfSource, RDBDataTable.colNameRecordUuuid) },
    { name: ResultNodeTable.colNames.parentUuid, value: dfVar(dfSource, RDBDataView.getColUuid(entityDefStep)) },
  ].map((uuidMapping) => setVar(dfVar(dfResult, uuidMapping.name), uuidMapping.value))

  yield this.appendContent(setDfResult, ...setUuids)
}

function* initSetAttributeCodeValues() {
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
}

function* initPutResults(dfSource, step) {
  const { surveyId } = this.rChain
  const scripts = []

  // csv file
  const fileResults = `${this.dirResults}/${dfSource}.csv`
  scripts.push(writeCsv(dfSource, fileResults))
  // zip file
  const fileZip = `${this.dirResults}/${dfSource}.zip`
  scripts.push(zipr(fileZip, fileResults))
  // put request
  scripts.push(arenaPutFile(ApiRoutes.rChain.stepEntityData(surveyId, ProcessingStep.getUuid(step)), fileZip))

  yield this.appendContent(...scripts)
}

function* initScript() {
  const { chain, survey } = this.rChain
  const steps = ProcessingChain.getProcessingSteps(chain).filter(ProcessingStep.hasEntity)

  // create results dir
  yield this.appendContent(dirCreate(this.dirResults))

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i]
    const entityDefStep = Survey.getNodeDefByUuid(ProcessingStep.getEntityUuid(step))(survey)

    const dfSource = NodeDef.getName(entityDefStep)
    const dfResult = `${NodeDef.getName(entityDefStep)}Result`

    yield this.logInfo(`'Uploading results for entity ${dfSource} started'`)

    yield* this.initDfResult(dfSource, dfResult, step, entityDefStep)
    yield* this.initSetAttributeCodeValues()
    yield* this.initPutResults(dfSource, step)

    yield this.logInfo(`'Uploading results for entity ${dfSource} completed'`)
  }

  // remove results dir
  yield this.appendContent(unlink(this.dirResults))
}

export default class RFilePersistResults extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'persist-results')
  }

  async init() {
    await super.init()

    this.dirResults = 'system/results'
    this.initScript = initScript.bind(this)
    this.initDfResult = initDfResult.bind(this)
    this.initSetAttributeCodeValues = initSetAttributeCodeValues.bind(this)
    this.initPutResults = initPutResults.bind(this)

    await PromiseUtils.resolveGenerator(this.initScript())

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
