import { RecordNodesCompactor } from '@core/record/_record/recordNodesCompactor'

// new string instance with the same content (as parsed from a db row or a JSON response)
const copyString = (value: string): string => JSON.parse(JSON.stringify({ value })).value

const rootUuid = 'a7d7a0f4-6f50-4e4e-9d4b-1b0f2bba3b61'
const recordUuid = '5f0b7c1e-28a6-4d7c-9b0e-3a4c2f2b9e7d'
const itemUuid = 'c3b8c1f0-1f7e-4d1a-8e5b-9a6d1e3b2c4f'

const newCodeNode = (uuid: string): any => ({
  uuid,
  parentUuid: copyString(rootUuid),
  recordUuid: copyString(recordUuid),
  nodeDefUuid: copyString('0e7c3c1a-5a4b-4b8c-9f2d-6e1a7b3c4d5e'),
  value: { itemUuid: copyString(itemUuid) },
  meta: { h: [copyString(rootUuid)] },
  refData: { categoryItem: { uuid: copyString(itemUuid), props: { code: '1', labels: { en: 'One' } } } },
})

describe('RecordNodesCompactor', () => {
  it('shares ref data objects among nodes with the same category item', () => {
    const nodes = [newCodeNode('n1'), newCodeNode('n2')]
    RecordNodesCompactor.compactNodes(nodes)
    expect(nodes[0].refData).toBe(nodes[1].refData)
    expect(nodes[1].refData.categoryItem.props.code).toBe('1')
  })

  it('keeps node values, hierarchy and ids unchanged', () => {
    const node = newCodeNode('n1')
    const expected = JSON.parse(JSON.stringify(node))
    RecordNodesCompactor.compactNodes({ n1: node })
    expect(node).toEqual(expected)
  })

  it('does not share ref data of different taxa or vernacular names', () => {
    const newTaxonNode = (uuid: string, vernacularNameUuid: string | null): any => ({
      uuid,
      recordUuid,
      nodeDefUuid: 'taxon-def',
      value: { taxonUuid: 't1', vernacularNameUuid },
      refData: { taxon: { uuid: 't1', vernacularNameUuid } },
    })
    const nodes = [newTaxonNode('n1', 'v1'), newTaxonNode('n2', 'v2'), newTaxonNode('n3', 'v1')]
    RecordNodesCompactor.compactNodes(nodes)
    expect(nodes[0].refData).not.toBe(nodes[1].refData)
    expect(nodes[0].refData).toBe(nodes[2].refData)
  })

  it('ignores nodes without meta, value or ref data', () => {
    const node: any = { uuid: 'n1', recordUuid, nodeDefUuid: 'def', value: null, refData: null }
    expect(RecordNodesCompactor.compactNodes([node])[0]).toEqual({
      uuid: 'n1',
      recordUuid,
      nodeDefUuid: 'def',
      value: null,
      refData: null,
    })
  })
})
