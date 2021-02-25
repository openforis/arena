import * as NodeDef from '@core/survey/nodeDef'

import * as RecordExpressionParser from '@core/record/recordExpressionParser'
import * as RecordUtils from '../../utils/recordUtils'
import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import { getContextUser } from '../../integration/config/context'

let survey = {}
let record = {}

let nodeDefault = {}

const getNode = (path) => RecordUtils.findNodeByPath(path)(survey, record)

describe('RecordExpressionParser Test', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_id', NodeDef.nodeDefType.integer).key(),
        SB.attribute('cluster_distance', NodeDef.nodeDefType.integer).key(),
        SB.attribute('visit_date', NodeDef.nodeDefType.date),
        SB.attribute('remarks', NodeDef.nodeDefType.text),
        SB.entity(
          'plot',
          SB.attribute('plot_id', NodeDef.nodeDefType.integer).key(),
          SB.attribute('plot_multiple_number', NodeDef.nodeDefType.integer).multiple(),
          SB.entity(
            'tree',
            SB.attribute('tree_id', NodeDef.nodeDefType.integer).key(),
            SB.attribute('tree_height', NodeDef.nodeDefType.integer),
            SB.attribute('dbh', NodeDef.nodeDefType.decimal)
          ).multiple()
        ).multiple()
      )
    ).build()

    record = RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_id', 12),
        RB.attribute('cluster_distance', 18),
        RB.attribute('visit_date', '2021-01-01'),
        RB.attribute('remarks', ''),
        RB.entity(
          'plot',
          RB.attribute('plot_id', 1),
          RB.attribute('plot_multiple_number', 10),
          RB.attribute('plot_multiple_number', 20),
          RB.entity('tree', RB.attribute('tree_id', 1), RB.attribute('tree_height', 10), RB.attribute('dbh', 7)),
          RB.entity('tree', RB.attribute('tree_id', 2), RB.attribute('tree_height', 11), RB.attribute('dbh', 10))
        ),
        RB.entity(
          'plot',
          RB.attribute('plot_id', 2),
          RB.entity('tree', RB.attribute('tree_id', 1), RB.attribute('tree_height', 12), RB.attribute('dbh', 18)),
          RB.entity('tree', RB.attribute('tree_id', 2), RB.attribute('tree_height', 10), RB.attribute('dbh', 15)),
          RB.entity('tree', RB.attribute('tree_id', 3), RB.attribute('tree_height', 30), RB.attribute('dbh', 20))
        ),
        RB.entity(
          'plot',
          RB.attribute('plot_id', 3),
          RB.attribute('plot_multiple_number', 30),
          RB.entity('tree', RB.attribute('tree_id', 1), RB.attribute('tree_height', 13), RB.attribute('dbh', 19)),
          RB.entity('tree', RB.attribute('tree_id', 2), RB.attribute('tree_height', 10), RB.attribute('dbh', 15)),
          RB.entity('tree', RB.attribute('tree_id', 3), RB.attribute('tree_height', 11), RB.attribute('dbh', 16)),
          RB.entity('tree', RB.attribute('tree_id', 4), RB.attribute('tree_height', 10), RB.attribute('dbh', 7)),
          RB.entity('tree', RB.attribute('tree_id', 5), RB.attribute('tree_height', 33), RB.attribute('dbh', 22))
        )
      )
    ).build()

    nodeDefault = RecordUtils.findNodeByPath('cluster/cluster_id')(survey, record)
  }, 10000)

  // ====== value expr tests
  const queries = [
    { q: 'cluster_id + 1', r: 13 },
    { q: 'cluster_id != 1', r: true },
    // !12 == null under strict logical negation semantics
    { q: '!cluster_id', r: null },
    // Number + String is invalid -> null
    { q: 'cluster_id + "1"', r: null },
    { q: '!(cluster_id == 1)', r: true },
    // 18 + 1
    { q: 'cluster_distance + 1', r: 19 },
    // 18 + 1
    { q: 'cluster_distance + 1', r: 19 },
    // 18 + 1 + 12
    { q: 'cluster_distance + 1 + cluster_id', r: 31 },
    // 18 + 12
    { q: 'cluster_distance + cluster_id', r: 30 },
    // 19 >= 12
    { q: 'cluster_distance + 1 >= cluster_id', r: true },
    // 18 * 0.5 >= 12
    { q: '(cluster_distance * 0.5) >= cluster_id', r: false },
    // 1728
    { q: 'pow(cluster_id, 3)', r: 1728 },
    // 18 * 0.5 >= 1728
    { q: '(cluster_distance * 0.5) >= pow(cluster_id, 3)', r: false },
    // visit_date must be before current date
    { q: 'visit_date <= now()', r: true },
    // cluster_id is not empty
    { q: 'isEmpty(cluster_id)', r: false },
    // remarks is empty
    { q: 'isEmpty(remarks)', r: true },
    // plot count is 3
    { q: 'plot.length', r: 3 },
    // access multiple entities with index
    { q: 'plot[0].plot_id', r: 1 },
    { q: 'plot[1].plot_id', r: 2 },
    { q: 'plot[2].plot_id', r: 3 },
    { q: 'plot[4].plot_id', r: null },
    // plot_multiple_number counts
    { q: 'plot[0].plot_multiple_number.length', r: 2 },
    { q: 'plot[1].plot_multiple_number.length', r: 0 },
    { q: 'plot[2].plot_multiple_number.length', r: 1 },
    // index (single entity)
    { q: 'index(cluster)', r: 0 },
    { q: 'index(cluster)', r: 0, n: 'cluster/plot[0]/plot_id' },
    // index (multiple entity)
    { q: 'index(plot)', r: 0, n: 'cluster/plot[0]' },
    { q: 'index(plot)', r: 1, n: 'cluster/plot[1]' },
    { q: 'index(plot)', r: 0, n: 'cluster/plot[0]/plot_id' },
    { q: 'index(plot)', r: 1, n: 'cluster/plot[1]/plot_id' },
    { q: 'index(plot[0])', r: 0 },
    { q: 'index(plot[1])', r: 1 },
    { q: 'index(plot[2])', r: 2 },
    { q: 'index(plot[3])', r: -1 },
    // index (single attribute)
    { q: 'index(visit_date)', r: 0, n: 'cluster/remarks' },
    { q: 'index(plot[0].plot_id)', r: 0 },
    { q: 'index(plot_id)', r: 0, n: 'cluster/plot[0]/plot_multiple_number[1]' },
    // index (multiple attribute)
    { q: 'index(plot[0].plot_multiple_number[0])', r: 0 },
    { q: 'index(plot[0].plot_multiple_number[1])', r: 1 },
    { q: 'index(plot[0].plot_multiple_number[2])', r: -1 },
    { q: 'index(plot_multiple_number)', r: 0, n: 'cluster/plot[0]/plot_multiple_number[0]' },
    { q: 'index(plot_multiple_number)', r: 1, n: 'cluster/plot[0]/plot_multiple_number[1]' },
    // parent
    { q: 'parent(cluster)', r: null },
    { q: 'parent(remarks)', r: () => getNode('cluster') },
    { q: 'parent(plot_id)', r: () => getNode('cluster/plot[1]'), n: 'cluster/plot[1]/plot_id' },
    { q: 'parent(parent(plot_id))', r: () => getNode('cluster'), n: 'cluster/plot[1]/plot_id' },
    { q: 'index(parent(plot_id))', r: 1, n: 'cluster/plot[1]/plot_id' },
    // access plot_id of previous plot
    { q: 'parent(parent(plot_id)).plot[index(parent(plot_id)) - 1].plot_id', r: 1, n: 'cluster/plot[1]/plot_id' },
    // access dbh of a tree inside sibling plot
    {
      q: 'parent(parent(parent(dbh))).plot[index(parent(parent(dbh))) - 2].tree[1].dbh',
      r: 10,
      n: 'cluster/plot[2]/tree[1]/dbh',
    },
  ]

  queries.forEach(({ q, r, n }) => {
    const testTitle = `${q}${n ? ` (${n})` : ''}`
    it(testTitle, () => {
      const resKeys = r ? Object.keys(r) : []
      const node = n ? getNode(n) : nodeDefault
      const res = RecordExpressionParser.evalNodeQuery(survey, record, node, q)
      if (resKeys.length === 0) {
        const resExpected = r instanceof Function ? r() : r
        expect(res).toEqual(resExpected)
      } else {
        resKeys.forEach((key) => expect(res[key]).toEqual(r[key]))
      }
    })
  })
})
