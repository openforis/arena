import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as RecordUtils from '../../utils/recordUtils'
import * as SurveyUtils from '../../utils/surveyUtils'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'

const { nodeDefType } = NodeDef

// A fake user, self-contained: getContextUser() (test/integration/config/context.js) relies on a
// global that's never actually set up for the unit test bundle, so every test in this file builds
// its own user rather than depending on that shared (and here, broken) fixture.
const user = { uuid: 'test-user-uuid' }

// Shifts every non-root node's internal id (iId, pIId, meta.hierarchy) in a record by a fixed
// offset, simulating an independently-built copy of "the same" record: mobile and the server each
// run their own legacy uuid->iId conversion (or just their own from-scratch build), so the same
// logical record ends up with two unrelated iId numberings for its non-root nodes. The root itself
// is left untouched: it's always the very first node assigned in any correctly-built record (iId 1
// on both sides), which is the one invariant replaceUpdatedNodes still relies on internal ids for.
const shiftInternalIds = (record, offset) => {
  const rootIId = Node.getIId(Record.getRootNode(record))
  const shift = (iId) => (iId === rootIId ? iId : iId + offset)
  const nodes = Record.getNodesArray(record)
  const nodesByIId = {}
  nodes.forEach((node) => {
    const parentIId = Node.getParentInternalId(node)
    const shiftedNode = {
      ...node,
      [Node.keys.iId]: shift(Node.getIId(node)),
      [Node.keys.pIId]: parentIId == null ? null : shift(parentIId),
      [Node.keys.meta]: {
        ...Node.getMeta(node),
        [Node.metaKeys.hierarchy]: Node.getHierarchy(node).map(shift),
      },
    }
    nodesByIId[shiftedNode[Node.keys.iId]] = shiftedNode
  })
  // Replace the node set wholesale (assocNodes/addNodes only merges into whatever's already there,
  // which is exactly wrong here) and drop any cached node index the original record may carry, so
  // it gets rebuilt from the shifted nodes instead of resolving stale, pre-shift entries.
  const recordShifted = { ...record, [Record.keys.nodes]: nodesByIId }
  delete recordShifted._nodesIndex
  recordShifted[Record.keys.lastNodeInternalId] = Record.getLastNodeInternalId(record) + offset
  return recordShifted
}

describe('RecordNodesUpdater (replace nodes, independently-numbered records) Test', () => {
  let survey
  let plotDefUuid
  let plotIdDefUuid

  beforeAll(async () => {
    survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_id', nodeDefType.integer).key(),
        SB.entity(
          'plot',
          SB.attribute('plot_id', nodeDefType.integer).key(),
          SB.attribute('plot_remarks', nodeDefType.text)
        ).multiple(),
        SB.attribute('plot_multiple_number', nodeDefType.integer).multiple()
      )
    ).build()

    plotDefUuid = NodeDef.getUuid(SurveyUtils.getNodeDefByPath({ survey, path: 'cluster/plot' }))
    plotIdDefUuid = NodeDef.getUuid(SurveyUtils.getNodeDefByPath({ survey, path: 'cluster/plot/plot_id' }))
  })

  const findPlotByPlotId = (record, plotId) => {
    const clusterNode = Record.getRootNode(record)
    const plots = Record.getNodeChildrenByDefUuid(clusterNode, plotDefUuid)(record)
    return plots.find((plot) => {
      const plotIdAttr = Record.getNodeChildrenByDefUuid(plot, plotIdDefUuid)(record)[0]
      return Node.getValue(plotIdAttr) === plotId
    })
  }

  const buildTargetRecord = () =>
    RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_id', 12),
        RB.entity('plot', RB.attribute('plot_id', 1), RB.attribute('plot_remarks', 'Plot 1 remarks')),
        RB.entity('plot', RB.attribute('plot_id', 2), RB.attribute('plot_remarks', 'Plot 2 remarks')),
        RB.attribute('plot_multiple_number', 10),
        RB.attribute('plot_multiple_number', 20)
      )
    ).build()

  it('updates a keyed multiple entity in place, by key value, not by (divergent) internal id', async () => {
    const recordTarget = buildTargetRecord()
    const plot1TargetIIdBefore = Node.getIId(findPlotByPlotId(recordTarget, 1))

    // an independently-built copy of "the same" record, with plot 1's remarks edited and its
    // internal ids shifted so they can never coincidentally match the target's
    const recordSourceRaw = RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_id', 12),
        RB.entity('plot', RB.attribute('plot_id', 1), RB.attribute('plot_remarks', 'Plot 1 remarks EDITED')),
        RB.entity('plot', RB.attribute('plot_id', 2), RB.attribute('plot_remarks', 'Plot 2 remarks')),
        RB.attribute('plot_multiple_number', 10),
        RB.attribute('plot_multiple_number', 20)
      )
    ).build()
    const recordSource = RecordUtils.shiftDateModifiedIntoTheFuture(shiftInternalIds(recordSourceRaw, 1000))

    const { record: recordUpdated } = await Record.replaceUpdatedNodes({
      survey,
      recordSource,
      sideEffect: false,
    })(recordTarget)

    const plot1Updated = findPlotByPlotId(recordUpdated, 1)
    const remarksAttr = Record.getNodeChildrenByDefUuid(
      plot1Updated,
      NodeDef.getUuid(SurveyUtils.getNodeDefByPath({ survey, path: 'cluster/plot/plot_remarks' }))
    )(recordUpdated)[0]
    expect(Node.getValue(remarksAttr)).toBe('Plot 1 remarks EDITED')

    // updated in place: same target-side internal id as before, not deleted-and-recreated with a
    // fresh one (which would orphan anything keyed off the old id - files, RDB rows, validations)
    expect(Node.getIId(plot1Updated)).toBe(plot1TargetIIdBefore)

    // plot 2 is unchanged and untouched by the shifted ids of the (unrelated) source record
    const plot2Updated = findPlotByPlotId(recordUpdated, 2)
    expect(plot2Updated).toBeDefined()
  })

  it('deletes a keyed multiple entity missing from source, adds one only in source, with a fresh id', async () => {
    const recordTarget = buildTargetRecord()

    // source has plot 1 (matches by key, unchanged) and plot 3 (new), but not plot 2 - independently
    // built and shifted, so no id in it can coincidentally collide with the target's
    const recordSourceRaw = RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_id', 12),
        RB.entity('plot', RB.attribute('plot_id', 1), RB.attribute('plot_remarks', 'Plot 1 remarks')),
        RB.entity('plot', RB.attribute('plot_id', 3), RB.attribute('plot_remarks', 'Plot 3 remarks')),
        RB.attribute('plot_multiple_number', 10),
        RB.attribute('plot_multiple_number', 20)
      )
    ).build()
    const recordSource = RecordUtils.shiftDateModifiedIntoTheFuture(shiftInternalIds(recordSourceRaw, 1000))

    const existingIIds = Record.getNodesArray(recordTarget).map(Node.getIId)

    const { record: recordUpdated } = await Record.replaceUpdatedNodes({
      survey,
      recordSource,
      sideEffect: false,
    })(recordTarget)

    // plot 2 (missing from source) is gone
    expect(findPlotByPlotId(recordUpdated, 2)).toBeUndefined()

    // plot 3 (only in source) was added, with a fresh id drawn from the target's own counter, not
    // the source's shifted (1000+) one, and not colliding with any id the target record already had
    const plot3Node = findPlotByPlotId(recordUpdated, 3)
    expect(plot3Node).toBeDefined()
    expect(Node.getIId(plot3Node)).toBeLessThan(1000)
    expect(existingIIds).not.toContain(Node.getIId(plot3Node))
  })

  it('pairs unkeyed multiple attributes by creation order, not by internal id', async () => {
    const recordTarget = buildTargetRecord()

    // same two values, but the second one's value changed - independently built and shifted
    const recordSourceRaw = RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_id', 12),
        RB.entity('plot', RB.attribute('plot_id', 1), RB.attribute('plot_remarks', 'Plot 1 remarks')),
        RB.entity('plot', RB.attribute('plot_id', 2), RB.attribute('plot_remarks', 'Plot 2 remarks')),
        RB.attribute('plot_multiple_number', 10),
        RB.attribute('plot_multiple_number', 99)
      )
    ).build()
    const recordSource = RecordUtils.shiftDateModifiedIntoTheFuture(shiftInternalIds(recordSourceRaw, 1000))

    const { record: recordUpdated } = await Record.replaceUpdatedNodes({
      survey,
      recordSource,
      sideEffect: false,
    })(recordTarget)

    const value0 = RecordUtils.findNodeValueByPath('cluster/plot_multiple_number[0]')(survey, recordUpdated)
    const value1 = RecordUtils.findNodeValueByPath('cluster/plot_multiple_number[1]')(survey, recordUpdated)
    expect(value0).toBe(10)
    expect(value1).toBe(99)
  })
})
