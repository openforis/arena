import { isLegacyNodeFormat, migrateRecordToInternalIds } from '@core/record/recordNodeIdMigration'

const recordUuid = 'record-uuid'
const rootUuid = 'root-uuid'
const childUuid = 'child-uuid'
const grandchildUuid = 'grandchild-uuid'

const buildLegacyRecord = (): any => ({
  uuid: recordUuid,
  nodes: {
    [rootUuid]: {
      uuid: rootUuid,
      recordUuid,
      nodeDefUuid: 'cluster-def-uuid',
      meta: { h: [] },
    },
    [childUuid]: {
      uuid: childUuid,
      parentUuid: rootUuid,
      recordUuid,
      nodeDefUuid: 'plot-def-uuid',
      meta: { h: [rootUuid] },
    },
    [grandchildUuid]: {
      uuid: grandchildUuid,
      parentUuid: childUuid,
      recordUuid,
      nodeDefUuid: 'tree-def-uuid',
      value: 10,
      meta: { h: [rootUuid, childUuid] },
    },
  },
})

describe('recordNodeIdMigration', () => {
  test('isLegacyNodeFormat detects a uuid/parentUuid-linked record', () => {
    expect(isLegacyNodeFormat(buildLegacyRecord())).toBe(true)
  })

  test('isLegacyNodeFormat returns false for an already-migrated record', () => {
    const migrated = migrateRecordToInternalIds(buildLegacyRecord())
    expect(isLegacyNodeFormat(migrated)).toBe(false)
  })

  test('isLegacyNodeFormat returns false for a record with no nodes', () => {
    expect(isLegacyNodeFormat({ uuid: recordUuid, nodes: {} })).toBe(false)
  })

  test('migrateRecordToInternalIds is a no-op on an already-migrated record', () => {
    const migratedOnce = migrateRecordToInternalIds(buildLegacyRecord())
    const migratedTwice = migrateRecordToInternalIds(migratedOnce)
    expect(migratedTwice).toBe(migratedOnce)
  })

  test('migrateRecordToInternalIds reassigns node identity and preserves the tree shape', () => {
    const migrated = migrateRecordToInternalIds(buildLegacyRecord())
    const nodesByIId = migrated.nodes
    const migratedNodes = Object.values(nodesByIId) as any[]

    expect(migratedNodes).toHaveLength(3)
    expect(migrated.lastNodeInternalId).toBe(3)

    const root = migratedNodes.find((node) => node.nodeDefUuid === 'cluster-def-uuid')
    const child = migratedNodes.find((node) => node.nodeDefUuid === 'plot-def-uuid')
    const grandchild = migratedNodes.find((node) => node.nodeDefUuid === 'tree-def-uuid')

    // uuid-based linkage is gone
    ;[root, child, grandchild].forEach((node) => {
      expect(node.uuid).toBeUndefined()
      expect(node.parentUuid).toBeUndefined()
    })

    // iId-based linkage is consistent
    expect(root.pIId).toBeNull()
    expect(child.pIId).toBe(root.iId)
    expect(grandchild.pIId).toBe(child.iId)

    // hierarchy meta remapped from ancestor uuids to ancestor iIds
    expect(root.meta.h).toEqual([])
    expect(child.meta.h).toEqual([root.iId])
    expect(grandchild.meta.h).toEqual([root.iId, child.iId])

    // nodes are stored keyed by their own iId
    expect(nodesByIId[root.iId]).toBe(root)
    expect(nodesByIId[child.iId]).toBe(child)
    expect(nodesByIId[grandchild.iId]).toBe(grandchild)

    // unrelated node data is untouched
    expect(grandchild.value).toBe(10)
    expect(migrated.uuid).toBe(recordUuid)
  })
})
