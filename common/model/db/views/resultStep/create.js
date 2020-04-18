import * as Survey from '../../../../../core/survey/survey'
import * as NodeDef from '../../../../../core/survey/nodeDef'
import * as ProcessingStep from '../../../../analysis/processingStep'
import * as ProcessingStepCalculation from '../../../../analysis/processingStepCalculation'

import TableResultNode from '../../tables/resultNode'

/**
 * Generate the query to create the view.
 *
 * @returns {string} - The SQL query.
 */
export function getCreate() {
  const stepUuid = ProcessingStep.getUuid(this.step)
  const tableResultNode = new TableResultNode(this.surveyId)
  const { columnSet: columnsResultNode } = TableResultNode

  const selectFields = []
  const joins = []
  let from = ''
  let where = ''
  const aliasPrefix = `_r`

  ProcessingStep.getCalculations(this.step).forEach((calculation, i) => {
    const nodeDef = Survey.getNodeDefByUuid(ProcessingStepCalculation.getNodeDefUuid(calculation))(this.survey)
    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    const nodeDefName = NodeDef.getName(nodeDef)

    const aliasResultNode = `${aliasPrefix}${i}`
    const nameResultNode = `${tableResultNode.schema}.${tableResultNode.name} AS ${aliasResultNode}`
    const conditionResultNode = `${aliasResultNode}.${columnsResultNode.nodeDefUuid} = '${nodeDefUuid}'`

    if (NodeDef.isCode(nodeDef)) {
      selectFields.push(`${aliasResultNode}.value->'code' AS ${nodeDefName}_code`)
      selectFields.push(`${aliasResultNode}.value->'label' AS ${nodeDefName}_label`)
    } else {
      selectFields.push(`${aliasResultNode}.value AS ${nodeDefName}`)
    }

    if (i === 0) {
      selectFields.push(`${aliasResultNode}.${columnsResultNode.parentUuid}`)
      from = `FROM ${nameResultNode}`
      where = `WHERE ${conditionResultNode}`
    } else {
      const aliasPrev = `${aliasPrefix}${i - 1}`
      const conditionResultNodePrev = `${aliasResultNode}.${columnsResultNode.stepUuid} = '${stepUuid}'
        AND ${aliasResultNode}.${columnsResultNode.parentUuid} = ${aliasPrev}.${columnsResultNode.parentUuid}`

      joins.push(`
        FULL OUTER JOIN ${nameResultNode}
        ON ${conditionResultNodePrev}
        AND ${conditionResultNode}
      `)
    }
  })

  return `CREATE MATERIALIZED VIEW ${this.schema}.${this.name} AS
    SELECT ${selectFields.join(', ')}
    ${from}
    ${joins.join(' ')}
    ${where}`
}
