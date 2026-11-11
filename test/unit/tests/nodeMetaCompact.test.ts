import * as Node from '@core/record/node'

describe('Node.compactMeta', () => {
  it('removes the items having the default value', () => {
    const meta = {
      h: ['root-uuid'],
      hCode: [],
      childApplicability: {},
      cEdit: {},
      cVis: {},
      cReq: {},
      childrenMaxCount: {},
      childrenMinCount: {},
      defaultValueApplied: false,
      qualifierValueApplied: false,
    }
    expect(Node.compactMeta(meta)).toEqual({ h: ['root-uuid'] })
  })

  it('removes a null code hierarchy', () => {
    expect(Node.compactMeta({ h: [], hCode: null })).toEqual({ h: [] })
  })

  it('keeps the items not having the default value', () => {
    const meta = {
      h: [],
      hCode: ['parent-code-uuid'],
      childApplicability: { 'def-1': false },
      cEdit: { 'def-2': false },
      cVis: { 'def-3': false },
      cReq: { 'def-5': false },
      childrenMaxCount: { 'def-4': 3 },
      childrenMinCount: { 'def-4': 0 },
      defaultValueApplied: true,
      qualifierValueApplied: true,
    }
    expect(Node.compactMeta(meta)).toEqual(meta)
  })

  it('returns an empty object when the meta is missing', () => {
    expect(Node.compactMeta(undefined)).toEqual({})
  })
})

describe('Node.getMetaKeysWithDefaultValue', () => {
  it('returns only the keys of the items having the default value', () => {
    const meta = { h: [], hCode: [], cVis: { 'def-1': false }, defaultValueApplied: false, qualifierValueApplied: true }
    expect(Node.getMetaKeysWithDefaultValue(meta)).toEqual(['hCode', 'defaultValueApplied'])
  })

  it('returns the key of an emptied child flags dictionary (to remove it from the stored meta)', () => {
    expect(Node.getMetaKeysWithDefaultValue({ h: [], cReq: {} })).toEqual(['cReq'])
  })

  it('returns an empty array when the meta is missing', () => {
    expect(Node.getMetaKeysWithDefaultValue(null)).toEqual([])
  })
})
