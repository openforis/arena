import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as CollectImportReportItem from '@core/survey/collectImportReportItem'
import NodeDefsImportJob from '@server/modules/collectImport/service/collectImport/metaImportJobs/nodeDefsImportJob/nodeDefsImportJob'

import { getContextUser } from '../../integration/config/context'
import * as DataTest from '../../utils/dataTest'

let survey = {}

const collectNodeDef = (attributes) => ({ attributes })

const parseRequiredIf = async ({ nodeDefName, attributes, multiple = false }) => {
  const job = new NodeDefsImportJob({ survey })
  job.nodeDefs = Survey.getNodeDefs(survey)
  const nodeDef = Survey.getNodeDefByName(nodeDefName)(survey)
  const requiredIf = await job.parseRequiredIf({
    nodeDef,
    type: NodeDef.getType(nodeDef),
    multiple,
    collectNodeDef: collectNodeDef(attributes),
  })
  return { requiredIf, importIssues: job.importIssues }
}

describe('Collect import - requiredIf', () => {
  beforeAll(async () => {
    survey = await DataTest.createTestSurvey({ user: getContextUser() })
  }, 10000)

  it('converts the condition of a single non-key attribute', async () => {
    const { requiredIf, importIssues } = await parseRequiredIf({
      nodeDefName: 'remarks',
      attributes: { requiredIf: 'cluster_distance > 10' },
    })
    expect(requiredIf.map((expression) => NodeDefExpression.getExpression(expression).trim())).toEqual([
      'cluster_distance > 10',
    ])
    expect(importIssues).toHaveLength(1)
    expect(CollectImportReportItem.getExpressionType(importIssues[0])).toBe(
      CollectImportReportItem.exprTypes.requiredIf
    )
    expect(CollectImportReportItem.isResolved(importIssues[0])).toBe(true)
  })

  it('reports an unresolved condition', async () => {
    const { requiredIf, importIssues } = await parseRequiredIf({
      nodeDefName: 'remarks',
      attributes: { requiredIf: 'not_existing_attribute > 10' },
    })
    expect(requiredIf).toBeNull()
    expect(CollectImportReportItem.isResolved(importIssues[0])).toBe(false)
  })

  it('ignores the condition of key, always required or multiple attributes', async () => {
    const cases = [
      { nodeDefName: 'cluster_id', attributes: { requiredIf: 'cluster_distance > 10' } },
      { nodeDefName: 'remarks', attributes: { required: 'true', requiredIf: 'cluster_distance > 10' } },
      { nodeDefName: 'remarks', attributes: { requiredIf: 'cluster_distance > 10' }, multiple: true },
    ]
    for (const testCase of cases) {
      const { requiredIf, importIssues } = await parseRequiredIf(testCase)
      expect(requiredIf).toBeNull()
      expect(importIssues).toHaveLength(0)
    }
  })
})
