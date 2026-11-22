import type { ArenaRecordNode } from '@openforis/arena-core'

import { RecordNodesHierarchy } from '@core/record/_record/recordNodesHierarchy'

const newNode = ({ uuid, parentUuid = undefined, meta = {} }: { uuid: string; parentUuid?: string; meta?: object }) =>
  ({ uuid, parentUuid, recordUuid: 'record-1', nodeDefUuid: `def-${uuid}`, meta }) as unknown as ArenaRecordNode

describe('RecordNodesHierarchy.assocHierarchies', () => {
  it('rebuilds the hierarchy of every node from the parent uuids (root first)', () => {
    // nodes not sorted by depth
    const nodes = [
      newNode({ uuid: 'tree-attr', parentUuid: 'tree' }),
      newNode({ uuid: 'root' }),
      newNode({ uuid: 'tree', parentUuid: 'plot' }),
      newNode({ uuid: 'plot', parentUuid: 'root' }),
      newNode({ uuid: 'plot-attr', parentUuid: 'plot' }),
    ]
    RecordNodesHierarchy.assocHierarchies(nodes)
    const hierarchyByUuid = Object.fromEntries(nodes.map((node) => [node.uuid, node.meta?.h]))
    expect(hierarchyByUuid).toEqual({
      root: [],
      plot: ['root'],
      'plot-attr': ['root', 'plot'],
      tree: ['root', 'plot'],
      'tree-attr': ['root', 'plot', 'tree'],
    })
  })

  it('ignores a stored hierarchy and keeps the other meta items', () => {
    const nodes = {
      root: newNode({ uuid: 'root' }),
      plot: newNode({ uuid: 'plot', parentUuid: 'root', meta: { h: ['stale'], cVis: { 'def-1': false } } }),
    }
    RecordNodesHierarchy.assocHierarchies(nodes)
    expect(nodes.plot.meta).toEqual({ h: ['root'], cVis: { 'def-1': false } })
  })

  it('shares the hierarchy array among siblings', () => {
    const nodes = [
      newNode({ uuid: 'root' }),
      newNode({ uuid: 'attr-1', parentUuid: 'root' }),
      newNode({ uuid: 'attr-2', parentUuid: 'root' }),
    ]
    RecordNodesHierarchy.assocHierarchies(nodes)
    expect(nodes[1].meta?.h).toBe(nodes[2].meta?.h)
  })

  it('keeps the current hierarchy of a node whose ancestors are not all included', () => {
    const nodes = [
      newNode({ uuid: 'tree', parentUuid: 'plot', meta: { h: ['root', 'plot'] } }),
      newNode({ uuid: 'tree-attr', parentUuid: 'tree' }),
    ]
    RecordNodesHierarchy.assocHierarchies(nodes)
    expect(nodes[0].meta?.h).toEqual(['root', 'plot'])
    expect(nodes[1].meta?.h).toBeUndefined()
  })
})
