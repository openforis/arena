import type { NodeDefType } from '@openforis/arena-core'

import * as NodeDef from '@core/survey/nodeDef'

const { nodeDefType } = NodeDef

const newAttributeDef = (type: NodeDefType, published = false) => ({
  ...NodeDef.newNodeDef(null, type, ['0']),
  published,
})

describe('NodeDef.getConvertibleTypes', () => {
  it('allows only decimal for a published integer attribute', () => {
    expect(NodeDef.getConvertibleTypes(newAttributeDef(nodeDefType.integer, true))).toEqual([nodeDefType.decimal])
  })

  it('allows no conversion for other published attributes', () => {
    expect(NodeDef.getConvertibleTypes(newAttributeDef(nodeDefType.decimal, true))).toEqual([])
    expect(NodeDef.getConvertibleTypes(newAttributeDef(nodeDefType.text, true))).toEqual([])
  })

  it('allows every other attribute type for an unpublished attribute', () => {
    const types = NodeDef.getConvertibleTypes(newAttributeDef(nodeDefType.integer))
    expect(types).toContain(nodeDefType.decimal)
    expect(types).toContain(nodeDefType.text)
    expect(types).not.toContain(nodeDefType.integer)
    expect(types).not.toContain(nodeDefType.entity)
  })

  it('allows no conversion for entities', () => {
    expect(NodeDef.getConvertibleTypes(newAttributeDef(nodeDefType.entity))).toEqual([])
  })
})
