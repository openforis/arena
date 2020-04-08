import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as ResultNodeTable from '@common/surveyRdb/resultNodeTable'

import MassiveInsert from '@server/db/massiveInsert'

export default class MassiveInsertNodeResults extends MassiveInsert {
  constructor(survey, calculations, tx) {
    const cols = [
      ResultNodeTable.colNames.processingChainUuid,
      ResultNodeTable.colNames.processingStepUuid,
      ResultNodeTable.colNames.recordUuid,
      ResultNodeTable.colNames.parentUuid,
      ResultNodeTable.colNames.nodeDefUuid,
      ResultNodeTable.colNames.value,
    ]
    super(SchemaRdb.getName(Survey.getId(survey)), ResultNodeTable.tableName, cols, tx)

    this.survey = survey
    this.calculations = calculations
  }

  async push(row) {
    const insertValues = []
    this.calculations.forEach((calculation) => {
      const nodeDef = Survey.getNodeDefByUuid(ProcessingStepCalculation.getNodeDefUuid(calculation))(this.survey)
      const nodeDefName = NodeDef.getName(nodeDef)
      const nodeDefUuid = NodeDef.getUuid(nodeDef)
      let value = row[nodeDefName]
      if (value === 'NA') value = null

      const insertValue = {
        [ResultNodeTable.colNames.processingChainUuid]: row[ResultNodeTable.colNames.processingChainUuid],
        [ResultNodeTable.colNames.processingStepUuid]: row[ResultNodeTable.colNames.processingStepUuid],
        [ResultNodeTable.colNames.recordUuid]: row[ResultNodeTable.colNames.recordUuid],
        [ResultNodeTable.colNames.parentUuid]: row[ResultNodeTable.colNames.parentUuid],
        [ResultNodeTable.colNames.nodeDefUuid]: nodeDefUuid,
        [ResultNodeTable.colNames.value]: value,
      }
      insertValues.push(insertValue)
    })
    return super.push(...insertValues)
  }
}
