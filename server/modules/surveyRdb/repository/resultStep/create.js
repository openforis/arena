import { db } from '../../../../db/db'

import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'
import * as ProcessingStep from '../../../../../common/analysis/processingStep'
import * as ProcessingStepCalculation from '../../../../../common/analysis/processingStepCalculation'

import { TableResultNode, ViewResultStep } from '../../../../../common/model/db'

/**
 * Creates the result step materialized view.
 *
 * @param {object} params - The query parameters.
 * @param {Survey} params.survey - The survey.
 * @param {ProcessingStep} params.step - The step to create the result view for.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<any>} - The result promise.
 */
export const createResultStepView = async ({ survey, step }, client = db) => {
  const viewResultStep = new ViewResultStep(survey, step)
  /**
   * @type {TableResultNode[]}
   * Keep reference to all result node tables visited.
   */
  const tableResultNodes = []
  const selectFields = []
  const joins = []
  let from = ''
  let where = ''

  ProcessingStep.getCalculations(viewResultStep.step).forEach((calculation, i) => {
    const nodeDefUuid = ProcessingStepCalculation.getNodeDefUuid(calculation)
    const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(viewResultStep.survey)
    const nodeDefName = NodeDef.getName(nodeDef)

    const tableResultNode = new TableResultNode(viewResultStep.surveyId)
    tableResultNode.alias = `_r${i}`
    tableResultNodes.push(tableResultNode)

    const conditionResultNode = `${tableResultNode.columnNodeDefUuid} = '${nodeDefUuid}'`

    if (NodeDef.isCode(nodeDef)) {
      selectFields.push(`${tableResultNode.columnValue}->'code' AS ${nodeDefName}_code`)
      selectFields.push(`${tableResultNode.columnValue}->'label' AS ${nodeDefName}_label`)
    } else {
      selectFields.push(`${tableResultNode.columnValue} AS ${nodeDefName}`)
    }

    if (i === 0) {
      selectFields.splice(0, 0, `${tableResultNode.columnParentUuid}`)
      from = `FROM ${tableResultNode.nameFull}`
      where = `WHERE ${conditionResultNode}`
    } else {
      const tableResultNodePrev = tableResultNodes[i - 1]
      joins.push(`
        FULL OUTER JOIN ${tableResultNode.nameFull}
        ON ${tableResultNode.columnStepUuid} = '${ProcessingStep.getUuid(viewResultStep.step)}'
        AND ${tableResultNode.columnParentUuid} = ${tableResultNodePrev.columnParentUuid}
        AND ${conditionResultNode}
      `)
    }
  })

  return client.query(`CREATE MATERIALIZED VIEW ${viewResultStep.schema}."${viewResultStep.name}" AS
    SELECT ${selectFields.join(', ')}
    ${from}
    ${joins.join(' ')}
    ${where}`)
}
