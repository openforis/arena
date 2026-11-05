import * as NodeDef from '@core/survey/nodeDef'

const { nodeDefType } = NodeDef

describe('NodeDef.getConvertibleTypes', () => {
  it('allows only decimal for a published integer attribute', () => {
    expect(NodeDef.getConvertibleTypes({ type: nodeDefType.integer, published: true })).toEqual([nodeDefType.decimal])
  })

  it('allows no conversion for other published attributes', () => {
    expect(NodeDef.getConvertibleTypes({ type: nodeDefType.decimal, published: true })).toEqual([])
    expect(NodeDef.getConvertibleTypes({ type: nodeDefType.text, published: true })).toEqual([])
  })

  it('allows every other attribute type for an unpublished attribute', () => {
    const types = NodeDef.getConvertibleTypes({ type: nodeDefType.integer })
    expect(types).toContain(nodeDefType.decimal)
    expect(types).toContain(nodeDefType.text)
    expect(types).not.toContain(nodeDefType.integer)
    expect(types).not.toContain(nodeDefType.entity)
  })

  it('allows no conversion for entities', () => {
    expect(NodeDef.getConvertibleTypes({ type: nodeDefType.entity })).toEqual([])
  })
})
