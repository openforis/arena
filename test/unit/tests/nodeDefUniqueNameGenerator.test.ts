import NodeDefUniqueNameGenerator from '@server/modules/collectImport/service/collectImport/model/nodeDefUniqueNameGenerator'

// same format checked by Validator.validateName on the node def name
const validNameRegex = /^[a-z][a-z0-9_]{0,39}$/

const name40 = 'available_transportation_types_to_referr' // 40 characters, as returned by StringUtils.normalizeName

describe('NodeDefUniqueNameGenerator', () => {
  test('unique name is kept', () => {
    const generator = new NodeDefUniqueNameGenerator()
    expect(generator.getUniqueNodeDefName({ parentNodeDefName: 'plot', nodeDefName: 'tree_height' })).toBe(
      'tree_height'
    )
  })

  test('duplicate name gets the parent name as prefix', () => {
    const generator = new NodeDefUniqueNameGenerator()
    generator.getUniqueNodeDefName({ parentNodeDefName: 'cluster', nodeDefName: 'remarks' })
    expect(generator.getUniqueNodeDefName({ parentNodeDefName: 'plot', nodeDefName: 'remarks' })).toBe('plot_remarks')
  })

  test('keyword gets the parent name as prefix', () => {
    const generator = new NodeDefUniqueNameGenerator()
    expect(generator.getUniqueNodeDefName({ parentNodeDefName: 'plot', nodeDefName: 'id' })).toBe('plot_id')
  })

  test('long duplicate names are truncated to 40 characters and stay unique', () => {
    const generator = new NodeDefUniqueNameGenerator()
    const names = [
      generator.getUniqueNodeDefName({ parentNodeDefName: 'transportation', nodeDefName: name40 }),
      generator.getUniqueNodeDefName({ parentNodeDefName: 'transport', nodeDefName: name40 }),
      generator.getUniqueNodeDefName({ parentNodeDefName: 'transport', nodeDefName: name40 }),
      generator.getUniqueNodeDefName({ parentNodeDefName: 'transport', nodeDefName: name40 }),
    ]
    expect(names[0]).toBe(name40)
    expect(names[1]).toBe('transport_available_transportation_types')
    expect(names[2]).toBe('transport_available_transportation_typ_1')
    expect(names[3]).toBe('transport_available_transportation_typ_2')
    for (const name of names) {
      expect(name).toMatch(validNameRegex)
    }
    expect(new Set(names).size).toBe(names.length)
  })

  test('duplicate name without parent gets a numeric suffix', () => {
    const generator = new NodeDefUniqueNameGenerator()
    generator.getUniqueNodeDefName({ nodeDefName: name40 })
    expect(generator.getUniqueNodeDefName({ nodeDefName: name40 })).toBe('available_transportation_types_to_refe_1')
  })

  test('name not starting with a letter gets a prefix', () => {
    const generator = new NodeDefUniqueNameGenerator()
    expect(generator.getUniqueNodeDefName({ parentNodeDefName: 'data', nodeDefName: '_7' })).toBe('n__7')
    expect(generator.getUniqueNodeDefName({ parentNodeDefName: 'data', nodeDefName: '2nd_visit' })).toBe('n_2nd_visit')
  })
})
