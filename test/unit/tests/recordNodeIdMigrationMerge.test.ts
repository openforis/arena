import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import { migrateRecordToInternalIds } from '@core/record/recordNodeIdMigration'

import * as SurveyUtils from '../../utils/surveyUtils'
import * as SB from '../../utils/surveyBuilder'

const { nodeDefType } = NodeDef

// Reproduces this real-world sequence end to end, using the actual migration function rather
// than a synthetic id shift:
//   1. A pre-migration arena-mobile build submits a record while it's still linked by
//      uuid/parentUuid ("legacy" format). The server migrates it to iId/pIId and stores it -
//      this becomes the target record below.
//   2. arena-mobile itself later upgrades past the node internal-id migration, and runs the very
//      same conversion locally on its own (still-legacy) copy of that record. Since the two
//      migrations run independently - different node insertion order on each side is enough to
//      make the depth-tie-break in migrateRecordToInternalIds diverge - the resulting iIds for
//      non-root nodes don't have to (and here, deliberately don't) match the server's.
//   3. The user edits the record in the now-migrated app and re-submits it. This becomes the
//      source record below, fed into the same replaceUpdatedNodes path RecordsImportJob uses for
//      an "overwrite" (same-uuid) import.
// The point of the test is that steps 1-3 preserve each node's original dateCreated even though
// they diverge on iId, so replaceUpdatedNodes's identity matching (key values for keyed entities,
// dateCreated for everything else - see recordsCombiner.js) still recognizes unedited nodes as
// unchanged and the edited one as an in-place update, not a delete-and-recreate.

const user = { uuid: 'test-user-uuid' }

const recordUuid = 'shared-record-uuid'

const uuids = {
  root: 'root-uuid',
  clusterId: 'cluster-id-uuid',
  plot1: 'plot1-uuid',
  plot1Id: 'plot1-id-uuid',
  plot1Remarks: 'plot1-remarks-uuid',
  plot2: 'plot2-uuid',
  plot2Id: 'plot2-id-uuid',
  plot2Remarks: 'plot2-remarks-uuid',
  multNum0: 'mult-num-0-uuid',
  multNum1: 'mult-num-1-uuid',
  // only ever included in a source record, to represent something added after the original
  // submission - never in the target, so they exercise the "add new node" path
  plot3: 'plot3-uuid',
  plot3Id: 'plot3-id-uuid',
  plot3Remarks: 'plot3-remarks-uuid',
  multNum2: 'mult-num-2-uuid',
}

// One fixed creation timestamp per logical node, shared by every independently-built copy of the
// record: these are the same nodes, created once, at the original submission - only the app that
// migrates and re-submits them can differ.
const dateCreatedOf = (index: number) => new Date(2024, 0, 1, 0, 0, index)
const originalDateModified = new Date(2024, 0, 1, 0, 0, 0)
const editDateModified = new Date(2024, 0, 2, 0, 0, 0) // the mobile edit, well after the original submission

describe('recordsCombiner (cross node-id-migration merge)', () => {
  let survey: any
  let defUuids: { [name: string]: string }

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

    defUuids = {
      cluster: NodeDef.getUuid(SurveyUtils.getNodeDefByPath({ survey, path: 'cluster' })),
      clusterId: NodeDef.getUuid(SurveyUtils.getNodeDefByPath({ survey, path: 'cluster/cluster_id' })),
      plot: NodeDef.getUuid(SurveyUtils.getNodeDefByPath({ survey, path: 'cluster/plot' })),
      plotId: NodeDef.getUuid(SurveyUtils.getNodeDefByPath({ survey, path: 'cluster/plot/plot_id' })),
      plotRemarks: NodeDef.getUuid(SurveyUtils.getNodeDefByPath({ survey, path: 'cluster/plot/plot_remarks' })),
      plotMultipleNumber: NodeDef.getUuid(
        SurveyUtils.getNodeDefByPath({ survey, path: 'cluster/plot_multiple_number' })
      ),
    }
  })

  const legacyNode = ({
    uuid,
    parentUuid = null,
    nodeDefUuid,
    hierarchy = [],
    value = null,
    dateCreated,
    dateModified = dateCreated,
  }: {
    uuid: string
    parentUuid?: string | null
    nodeDefUuid: string
    hierarchy?: string[]
    value?: any
    dateCreated: Date
    dateModified?: Date
  }) => ({
    uuid,
    parentUuid,
    recordUuid,
    nodeDefUuid,
    value,
    dateCreated,
    dateModified,
    meta: { h: hierarchy },
  })

  // Builds the legacy uuid/parentUuid-linked record (the shape arena-mobile produced before the
  // node internal-id migration). `nodeOrder` controls the insertion order of the returned `nodes`
  // object - migrateRecordToInternalIds breaks same-depth ties by that order, so two calls with a
  // different order (but otherwise identical node data) simulate two independent migrations of
  // "the same" record disagreeing on non-root iIds, exactly as the server's and arena-mobile's own
  // migration would if they ran at different times against differently-ordered local node maps.
  const buildLegacyRecord = ({
    nodeOrder,
    plot1RemarksValue = 'Plot 1 remarks',
    plot1RemarksDateModified = originalDateModified,
    includePlot3 = false,
    extraMultNumValue = null,
  }: {
    nodeOrder: string[]
    plot1RemarksValue?: string
    plot1RemarksDateModified?: Date
    includePlot3?: boolean
    extraMultNumValue?: number | null
  }) => {
    const nodesByUuid: { [uuid: string]: any } = {
      [uuids.root]: legacyNode({
        uuid: uuids.root,
        nodeDefUuid: defUuids.cluster,
        dateCreated: dateCreatedOf(0),
      }),
      [uuids.clusterId]: legacyNode({
        uuid: uuids.clusterId,
        parentUuid: uuids.root,
        nodeDefUuid: defUuids.clusterId,
        hierarchy: [uuids.root],
        value: 12,
        dateCreated: dateCreatedOf(1),
      }),
      [uuids.plot1]: legacyNode({
        uuid: uuids.plot1,
        parentUuid: uuids.root,
        nodeDefUuid: defUuids.plot,
        hierarchy: [uuids.root],
        dateCreated: dateCreatedOf(2),
      }),
      [uuids.plot1Id]: legacyNode({
        uuid: uuids.plot1Id,
        parentUuid: uuids.plot1,
        nodeDefUuid: defUuids.plotId,
        hierarchy: [uuids.root, uuids.plot1],
        value: 1,
        dateCreated: dateCreatedOf(3),
      }),
      [uuids.plot1Remarks]: legacyNode({
        uuid: uuids.plot1Remarks,
        parentUuid: uuids.plot1,
        nodeDefUuid: defUuids.plotRemarks,
        hierarchy: [uuids.root, uuids.plot1],
        value: plot1RemarksValue,
        dateCreated: dateCreatedOf(4),
        dateModified: plot1RemarksDateModified,
      }),
      [uuids.plot2]: legacyNode({
        uuid: uuids.plot2,
        parentUuid: uuids.root,
        nodeDefUuid: defUuids.plot,
        hierarchy: [uuids.root],
        dateCreated: dateCreatedOf(5),
      }),
      [uuids.plot2Id]: legacyNode({
        uuid: uuids.plot2Id,
        parentUuid: uuids.plot2,
        nodeDefUuid: defUuids.plotId,
        hierarchy: [uuids.root, uuids.plot2],
        value: 2,
        dateCreated: dateCreatedOf(6),
      }),
      [uuids.plot2Remarks]: legacyNode({
        uuid: uuids.plot2Remarks,
        parentUuid: uuids.plot2,
        nodeDefUuid: defUuids.plotRemarks,
        hierarchy: [uuids.root, uuids.plot2],
        value: 'Plot 2 remarks',
        dateCreated: dateCreatedOf(7),
      }),
      [uuids.multNum0]: legacyNode({
        uuid: uuids.multNum0,
        parentUuid: uuids.root,
        nodeDefUuid: defUuids.plotMultipleNumber,
        hierarchy: [uuids.root],
        value: 10,
        dateCreated: dateCreatedOf(8),
      }),
      [uuids.multNum1]: legacyNode({
        uuid: uuids.multNum1,
        parentUuid: uuids.root,
        nodeDefUuid: defUuids.plotMultipleNumber,
        hierarchy: [uuids.root],
        value: 20,
        dateCreated: dateCreatedOf(9),
      }),
    }

    if (includePlot3) {
      nodesByUuid[uuids.plot3] = legacyNode({
        uuid: uuids.plot3,
        parentUuid: uuids.root,
        nodeDefUuid: defUuids.plot,
        hierarchy: [uuids.root],
        dateCreated: dateCreatedOf(10),
      })
      nodesByUuid[uuids.plot3Id] = legacyNode({
        uuid: uuids.plot3Id,
        parentUuid: uuids.plot3,
        nodeDefUuid: defUuids.plotId,
        hierarchy: [uuids.root, uuids.plot3],
        value: 3,
        dateCreated: dateCreatedOf(11),
      })
      nodesByUuid[uuids.plot3Remarks] = legacyNode({
        uuid: uuids.plot3Remarks,
        parentUuid: uuids.plot3,
        nodeDefUuid: defUuids.plotRemarks,
        hierarchy: [uuids.root, uuids.plot3],
        value: 'Plot 3 remarks',
        dateCreated: dateCreatedOf(12),
      })
    }

    if (extraMultNumValue != null) {
      nodesByUuid[uuids.multNum2] = legacyNode({
        uuid: uuids.multNum2,
        parentUuid: uuids.root,
        nodeDefUuid: defUuids.plotMultipleNumber,
        hierarchy: [uuids.root],
        value: extraMultNumValue,
        dateCreated: dateCreatedOf(13),
      })
    }

    const nodes: { [uuid: string]: any } = {}
    nodeOrder.forEach((uuid) => {
      nodes[uuid] = nodesByUuid[uuid]
    })

    return {
      ...Record.newRecord(user, Survey.cycleOneKey),
      uuid: recordUuid,
      nodes,
    }
  }

  // migrateRecordToInternalIds doesn't build the nodes index that the rest of the record model
  // (RecordReader / recordsCombiner) relies on to look up children - the real fetch path
  // (RecordManager.fetchRecordAndNodesByUuid) always builds it via Record.assocNodes after
  // loading, so a hand-built record here has to go through the same step.
  const finalizeRecord = (record: any) =>
    Record.assocNodes({ nodes: Record.getNodes(record), updateNodesIndex: true, sideEffect: true })(record)

  const migrateAndFinalize = (legacyRecord: any) => finalizeRecord(migrateRecordToInternalIds(legacyRecord))

  const findPlotByPlotId = (record: any, plotId: number) => {
    const clusterNode = Record.getRootNode(record)
    const plots = Record.getNodeChildrenByDefUuid(clusterNode, defUuids.plot)(record)
    return plots.find((plot: any) => {
      const plotIdAttr = Record.getNodeChildrenByDefUuid(plot, defUuids.plotId)(record)[0]
      return Node.getValue(plotIdAttr) === plotId
    })
  }

  // Server-side order: depth-first, plot 1 before plot 2, multNum0 before multNum1.
  const serverNodeOrder = [
    uuids.root,
    uuids.clusterId,
    uuids.plot1,
    uuids.plot1Id,
    uuids.plot1Remarks,
    uuids.plot2,
    uuids.plot2Id,
    uuids.plot2Remarks,
    uuids.multNum0,
    uuids.multNum1,
  ]

  // arena-mobile's independent local order: plot 2's subtree before plot 1's, and the multiple
  // attributes reversed - same nodes, same dateCreated values, different same-depth tie-break
  // order, so migrateRecordToInternalIds hands out different non-root iIds than the server did.
  const mobileNodeOrder = [
    uuids.root,
    uuids.clusterId,
    uuids.plot2,
    uuids.plot2Id,
    uuids.plot2Remarks,
    uuids.plot1,
    uuids.plot1Id,
    uuids.plot1Remarks,
    uuids.multNum1,
    uuids.multNum0,
  ]

  it('assigns different non-root iIds to the same logical record when migrated in a different node order', () => {
    const targetRecord = migrateAndFinalize(buildLegacyRecord({ nodeOrder: serverNodeOrder }))
    const sourceRecord = migrateAndFinalize(buildLegacyRecord({ nodeOrder: mobileNodeOrder }))

    const plot1Target = findPlotByPlotId(targetRecord, 1)
    const plot1Source = findPlotByPlotId(sourceRecord, 1)

    // sanity check that the two migrations actually diverge - otherwise the rest of this test
    // wouldn't be exercising cross-migration id divergence at all
    expect(Node.getIId(plot1Target)).not.toBe(Node.getIId(plot1Source))
    // the root is the one iId both migrations agree on, which is what replaceUpdatedNodes relies on
    expect(Node.getIId(Record.getRootNode(targetRecord))).toBe(Node.getIId(Record.getRootNode(sourceRecord)))
  })

  it('merges an edited, independently re-migrated record without losing node identity', async () => {
    const targetRecord = migrateAndFinalize(buildLegacyRecord({ nodeOrder: serverNodeOrder }))
    const plot1TargetIIdBefore = Node.getIId(findPlotByPlotId(targetRecord, 1))

    // arena-mobile's own migration of the same legacy record, after the user edited plot 1's
    // remarks and before re-submitting
    const sourceRecord = migrateAndFinalize(
      buildLegacyRecord({
        nodeOrder: mobileNodeOrder,
        plot1RemarksValue: 'Plot 1 remarks EDITED',
        plot1RemarksDateModified: editDateModified,
      })
    )

    const { record: recordUpdated } = await Record.replaceUpdatedNodes({
      user,
      survey,
      recordSource: sourceRecord,
      categoryItemProvider: undefined,
      taxonProvider: undefined,
      timezoneOffset: undefined,
      sideEffect: false,
    })(targetRecord)

    // plot 1 matched by key value (not by the diverging iId) and updated in place
    const plot1Updated = findPlotByPlotId(recordUpdated, 1)
    expect(Node.getIId(plot1Updated)).toBe(plot1TargetIIdBefore)
    const plot1RemarksUpdated = Record.getNodeChildrenByDefUuid(plot1Updated, defUuids.plotRemarks)(recordUpdated)[0]
    expect(Node.getValue(plot1RemarksUpdated)).toBe('Plot 1 remarks EDITED')

    // plot 2, untouched by the edit, is still there with its original remarks
    const plot2Updated = findPlotByPlotId(recordUpdated, 2)
    expect(plot2Updated).toBeDefined()
    const plot2RemarksUpdated = Record.getNodeChildrenByDefUuid(plot2Updated, defUuids.plotRemarks)(recordUpdated)[0]
    expect(Node.getValue(plot2RemarksUpdated)).toBe('Plot 2 remarks')

    // the unkeyed plot_multiple_number siblings have no key to match on and were inserted in
    // reverse order on the source side - only their (migration-preserved) dateCreated lets
    // replaceUpdatedNodes pair them correctly rather than by (here, misleading) array position
    const rootUpdated = Record.getRootNode(recordUpdated)
    const multNumbersUpdated = Record.getNodeChildrenByDefUuid(
      rootUpdated,
      defUuids.plotMultipleNumber
    )(recordUpdated).map(Node.getValue)
    expect(multNumbersUpdated.sort()).toEqual([10, 20])
  })

  it('assigns a fresh internal id (not the source one) to an entity added only in the source, and advances lastNodeInternalId past every node it adds', async () => {
    const targetRecord = migrateAndFinalize(buildLegacyRecord({ nodeOrder: serverNodeOrder }))
    const targetIIdsBefore = Record.getNodesArray(targetRecord).map(Node.getIId)
    const targetLastNodeInternalIdBefore = Record.getLastNodeInternalId(targetRecord)

    // arena-mobile's own migration of the same record, with a new plot (key 3) added locally -
    // plot 3's iId here comes from the source's own (independent) counter, and must not survive
    // the merge unchanged
    const sourceRecord = migrateAndFinalize(
      buildLegacyRecord({
        nodeOrder: [...mobileNodeOrder, uuids.plot3, uuids.plot3Id, uuids.plot3Remarks],
        includePlot3: true,
      })
    )
    const plot3IIdInSource = Node.getIId(findPlotByPlotId(sourceRecord, 3))

    const { record: recordUpdated } = await Record.replaceUpdatedNodes({
      user,
      survey,
      recordSource: sourceRecord,
      categoryItemProvider: undefined,
      taxonProvider: undefined,
      timezoneOffset: undefined,
      sideEffect: false,
    })(targetRecord)

    const plot3Updated = findPlotByPlotId(recordUpdated, 3)
    expect(plot3Updated).toBeDefined()
    const plot3UpdatedIId = Node.getIId(plot3Updated)
    const plot3IdAttrUpdated = Record.getNodeChildrenByDefUuid(plot3Updated, defUuids.plotId)(recordUpdated)[0]
    const plot3RemarksAttrUpdated = Record.getNodeChildrenByDefUuid(
      plot3Updated,
      defUuids.plotRemarks
    )(recordUpdated)[0]
    const newIIds = [plot3UpdatedIId, Node.getIId(plot3IdAttrUpdated), Node.getIId(plot3RemarksAttrUpdated)]

    // fresh id drawn from the target's own counter, not the source's (independently-numbered) one,
    // and not colliding with any id the target already had
    expect(plot3UpdatedIId).not.toBe(plot3IIdInSource)
    newIIds.forEach((iId) => {
      expect(targetIIdsBefore).not.toContain(iId)
      expect(iId).toBeGreaterThan(targetLastNodeInternalIdBefore)
    })
    // all 3 new nodes (the plot entity plus its 2 attributes) got distinct ids
    expect(new Set(newIIds).size).toBe(3)

    // lastNodeInternalId advanced past every node actually added, not just the last one assigned
    expect(Record.getLastNodeInternalId(recordUpdated)).toBe(targetLastNodeInternalIdBefore + newIIds.length)
  })

  it('assigns a fresh internal id to a value added only in the source to an unkeyed multiple attribute via mergeRecords, and advances lastNodeInternalId', async () => {
    const targetRecord = migrateAndFinalize(buildLegacyRecord({ nodeOrder: serverNodeOrder }))
    const targetIIdsBefore = Record.getNodesArray(targetRecord).map(Node.getIId)
    const targetLastNodeInternalIdBefore = Record.getLastNodeInternalId(targetRecord)

    // arena-mobile's own migration of the same record, with a third plot_multiple_number value
    // (30) added locally - this has no key to match on, so it can only be recognized as "new"
    // (not a match for an existing target value) rather than "the same node, renumbered"
    const sourceRecord = migrateAndFinalize(
      buildLegacyRecord({
        nodeOrder: [...mobileNodeOrder, uuids.multNum2],
        extraMultNumValue: 30,
      })
    )
    const multNum2IIdInSource = Node.getIId(
      Record.getNodesArray(sourceRecord).find((node: any) => Node.getValue(node) === 30)
    )

    const { record: recordUpdated } = await Record.mergeRecords({
      user,
      survey,
      recordSource: sourceRecord,
      categoryItemProvider: undefined,
      taxonProvider: undefined,
      timezoneOffset: undefined,
      sideEffect: false,
    })(targetRecord)

    const rootUpdated = Record.getRootNode(recordUpdated)
    const multNumbersUpdated = Record.getNodeChildrenByDefUuid(rootUpdated, defUuids.plotMultipleNumber)(recordUpdated)
    expect(multNumbersUpdated.map(Node.getValue).sort()).toEqual([10, 20, 30])

    const newNode = multNumbersUpdated.find((node: any) => Node.getValue(node) === 30)
    const newNodeIId = Node.getIId(newNode)

    // fresh id drawn from the target's own counter, not the source's, and not colliding with
    // anything the target already had
    expect(newNodeIId).not.toBe(multNum2IIdInSource)
    expect(targetIIdsBefore).not.toContain(newNodeIId)
    expect(newNodeIId).toBeGreaterThan(targetLastNodeInternalIdBefore)

    // lastNodeInternalId advanced by exactly the one node added
    expect(Record.getLastNodeInternalId(recordUpdated)).toBe(targetLastNodeInternalIdBefore + 1)
  })
})
