import * as Survey from '@core/survey/survey'

import { OdkExpressionConverter } from '@server/modules/odkImport/service/odkImport/metaImportJobs/nodeDefsImportJob/odkExpressionConverter'

import { getContextUser } from '../../integration/config/context'
import * as DataTest from '../../utils/dataTest'

let survey: any = {}
let nodeDefsByXFormPath: Map<string, any> = new Map()

// Synthetic XForm paths standing in for the real DataTest fixture's cluster/plot/plot_details/tree
// tree (the same fixture 008CollectExpressionConverter.test.js uses), so the converter's path
// resolution can be exercised against a real, already-validated Arena survey/NodeDef structure.
const xformPathByNodeDefName: Record<string, string> = {
  cluster: '/data',
  cluster_id: '/data/cluster_id',
  cluster_accessible: '/data/cluster_accessible',
  remarks: '/data/remarks',
  plot: '/data/plot',
  plot_id: '/data/plot/plot_id',
  plot_details: '/data/plot/plot_details',
  plot_remarks: '/data/plot/plot_details/plot_remarks',
  tree: '/data/plot/tree',
  tree_id: '/data/plot/tree/tree_id',
  tree_status: '/data/plot/tree/tree_status',
  tree_height: '/data/plot/tree/tree_height',
  dbh: '/data/plot/tree/dbh',
}

describe('odkExpressionConverter', () => {
  beforeAll(async () => {
    const user = getContextUser()
    survey = await DataTest.createTestSurvey({ user })

    nodeDefsByXFormPath = new Map(
      Object.entries(xformPathByNodeDefName).map(([name, path]) => [path, Survey.getNodeDefByName(name)(survey)])
    )
  }, 10000)

  const convertibleCases: Array<{ q: string; r: string; n: string }> = [
    // same-entity sibling (single "../"): tree_height referencing its sibling tree_status
    { q: `../tree_status = 'L'`, r: `tree_status == 'L'`, n: 'tree_height' },
    { q: `../tree_status='L' and ../dbh > 0`, r: `tree_status=='L' && dbh > 0`, n: 'tree_height' },
    // self-reference: "." -> Arena's `this` (constraint-style, validated against dbh's own decimal type)
    { q: '. > 0', r: 'this > 0', n: 'dbh' },
    { q: 'not(. = 0)', r: '!(this == 0)', n: 'dbh' },
    // ancestor-crossing (two "../../"): plot_id referencing cluster's remarks
    { q: '../../remarks', r: 'cluster.remarks', n: 'plot_id' },
    // absolute path, same effect as the relative one above
    { q: '/data/remarks', r: 'cluster.remarks', n: 'plot_id' },
    // multi-level entity chain: plot_id referencing plot_details/plot_remarks (sibling entity's child)
    { q: '../plot_details/plot_remarks', r: 'plot_details.plot_remarks', n: 'plot_id' },
    // boolean literals / today()
    { q: 'true()', r: 'true', n: 'cluster_id' },
    { q: 'false()', r: 'false', n: 'cluster_id' },
    { q: 'today()', r: 'now()', n: 'cluster_id' },
  ]

  convertibleCases.forEach(({ q: expression, r: expected, n: nodeDefName }) => {
    it(`${expression} (on ${nodeDefName}) => ${expected}`, async () => {
      const nodeDefCurrent = Survey.getNodeDefByName(nodeDefName)(survey)
      const currentXFormPath = xformPathByNodeDefName[nodeDefName]

      const converted = await OdkExpressionConverter.convert({
        survey,
        nodeDefCurrent,
        currentXFormPath,
        nodeDefsByXFormPath,
        expression,
      })

      expect(converted).not.toBeNull()
      expect((converted as string).trim()).toBe(expected)
    })
  })

  const unconvertibleCases: Array<{ q: string; n: string }> = [
    // unresolvable absolute path -> conversion fails, no guess
    { q: '/data/plot/tree/does_not_exist > 0', n: 'tree_height' },
    // if() -> Arena's expression validator rejects conditional expressions outright; never guessed
    { q: `if(../tree_status = 'L', 1, 0)`, n: 'tree_height' },
  ]

  unconvertibleCases.forEach(({ q: expression, n: nodeDefName }) => {
    it(`${expression} (on ${nodeDefName}) => unconvertible`, async () => {
      const nodeDefCurrent = Survey.getNodeDefByName(nodeDefName)(survey)
      const currentXFormPath = xformPathByNodeDefName[nodeDefName]

      const converted = await OdkExpressionConverter.convert({
        survey,
        nodeDefCurrent,
        currentXFormPath,
        nodeDefsByXFormPath,
        expression,
      })

      expect(converted).toBeNull()
    })
  })

  it("selected(., 'L') on a code attribute converts to includes(this, 'L')", async () => {
    const nodeDefCurrent = Survey.getNodeDefByName('tree_status')(survey)
    const converted = await OdkExpressionConverter.convert({
      survey,
      nodeDefCurrent,
      currentXFormPath: xformPathByNodeDefName.tree_status,
      nodeDefsByXFormPath,
      expression: `selected(., 'L')`,
    })
    expect(converted).not.toBeNull()
    expect((converted as string).trim()).toBe(`includes(this, 'L')`)
  })

  it("selected(../tree_status, 'L') converts to includes(tree_status, 'L')", async () => {
    const nodeDefCurrent = Survey.getNodeDefByName('tree_height')(survey)
    const converted = await OdkExpressionConverter.convert({
      survey,
      nodeDefCurrent,
      currentXFormPath: xformPathByNodeDefName.tree_height,
      nodeDefsByXFormPath,
      expression: `selected(../tree_status, 'L')`,
    })
    expect(converted).not.toBeNull()
    expect((converted as string).trim()).toBe(`includes(tree_status, 'L')`)
  })
})
