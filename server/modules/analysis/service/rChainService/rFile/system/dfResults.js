import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as ResultNodeTable from '@common/surveyRdb/resultNodeTable'
import * as RDBDataTable from '@server/modules/surveyRdb/schemaRdb/dataTable'
import * as RDBDataView from '@server/modules/surveyRdb/schemaRdb/dataView'

import * as RFileReadData from './rFileReadData'
import { dfVar, setVar, sqldf, vector } from '../../rFunctions'

/**
 * Class that models a data frame step results
 */
export default class DfResults {
  constructor(rChain, step) {
    this._rChain = rChain
    this._step = step
    this._scripts = []

    this.initDf()
    this.initUuids()
    this.initCodeAttributes()
  }

  get rChain() {
    return this._rChain
  }

  get chainUuid() {
    return this.rChain.chainUuid
  }

  get survey() {
    return this.rChain.survey
  }

  get surveyId() {
    return this.rChain.surveyId
  }

  get dirResults() {
    return this.rChain.dirResults
  }

  get step() {
    return this._step
  }

  get stepUuid() {
    return ProcessingStep.getUuid(this.step)
  }

  get calculations() {
    return ProcessingStep.getCalculations(this.step)
  }

  get entityDef() {
    return Survey.getNodeDefByUuid(ProcessingStep.getEntityUuid(this.step))(this.survey)
  }

  get dfSourceName() {
    return NodeDef.getName(this.entityDef)
  }

  get name() {
    return `${this.dfSourceName}Results`
  }

  get scripts() {
    return this._scripts
  }

  initDf() {
    // init attribute columns: only output attribute values
    const dfResultColumns = this.calculations.reduce((columnsAggregator, calculation) => {
      const nodeDefCalculation = Survey.getNodeDefByUuid(ProcessingStepCalculation.getNodeDefUuid(calculation))(
        this.survey
      )
      const nodeDefCalculationName = NodeDef.getName(nodeDefCalculation)
      columnsAggregator.push(
        `'${nodeDefCalculationName}'`,
        `'${nodeDefCalculationName}_${ResultNodeTable.colNames.nodeDefUuid}'`
      )
      return columnsAggregator
    }, [])
    this.scripts.push(setVar(this.name, `${this.dfSourceName}[, ${vector(dfResultColumns)}]`))
  }

  initUuids() {
    const setUuids = [
      { name: ResultNodeTable.colNames.processingChainUuid, value: `'${this.chainUuid}'` },
      { name: ResultNodeTable.colNames.processingStepUuid, value: `'${this.stepUuid}'` },
      { name: ResultNodeTable.colNames.recordUuid, value: dfVar(this.dfSourceName, RDBDataTable.colNameRecordUuuid) },
      {
        name: ResultNodeTable.colNames.parentUuid,
        value: dfVar(this.dfSourceName, RDBDataView.getColUuid(this.entityDef)),
      },
    ].map((uuidMapping) => setVar(dfVar(this.name, uuidMapping.name), uuidMapping.value))

    this.scripts.push(...setUuids)
  }

  initCodeAttributes() {
    this.calculations.forEach((calculation) => {
      const nodeDef = Survey.getNodeDefByUuid(ProcessingStepCalculation.getNodeDefUuid(calculation))(this.survey)
      if (NodeDef.isCode(nodeDef)) {
        const nodeVarName = NodeDef.getName(nodeDef)
        const nodeTmpVarName = `${nodeVarName}_TMP`
        const dfNodeVar = dfVar(this.name, nodeVarName)
        const dfNodeTmpVar = dfVar(this.name, nodeTmpVarName)
        const category = Survey.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(this.survey)
        const dfCategory = RFileReadData.getDfCategoryItems(category)

        // copy code value into temp variable
        this.scripts.push(setVar(dfNodeTmpVar, dfNodeVar))
        // remove code variable from data frame

        this.scripts.push(setVar(dfNodeVar, `NULL`))

        // join with category data frame to create json code value
        const query = `
            SELECT 
                r.*,
                "{${Node.valuePropKeys.itemUuid}: """ || c.uuid || """, ${Node.valuePropKeys.code}: """ || c.code || """, ${Node.valuePropKeys.label}: """ || c.label || """}" AS ${nodeVarName}
            FROM ${this.name} r
            LEFT OUTER JOIN ${dfCategory} c
            ON r.${nodeTmpVarName} = c.code  
        `
        this.scripts.push(setVar(this.name, sqldf(query)))

        // remove tmp var
        this.scripts.push(setVar(dfNodeTmpVar, `NULL`))
      }
    })
  }
}
