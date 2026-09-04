import { extractCallFirstTwoArgs } from '@core/expressionParser/helpers/functionCallArgs'

describe('extractCallFirstTwoArgs', () => {
  it('extracts a plain two-literal-arg call (single quotes)', () => {
    expect(extractCallFirstTwoArgs("categoryItemProp('species_cat', 'habitat', code)", 'categoryItemProp')).toEqual([
      ['species_cat', 'habitat'],
    ])
  })

  it('extracts a plain two-literal-arg call (double quotes)', () => {
    expect(extractCallFirstTwoArgs('taxonProp("trees", "status", code)', 'taxonProp')).toEqual([['trees', 'status']])
  })

  it('unescapes escaped quotes inside a literal', () => {
    expect(
      extractCallFirstTwoArgs(String.raw`categoryItemProp('sp\'ecies', 'habitat', code)`, 'categoryItemProp')
    ).toEqual([["sp'ecies", 'habitat']])
  })

  it('returns null for a non-literal (identifier) argument', () => {
    expect(extractCallFirstTwoArgs('categoryItemProp(categoryName, propName, code)', 'categoryItemProp')).toEqual([
      [null, null],
    ])
  })

  it('returns null only for the non-literal argument, keeping the literal one', () => {
    expect(extractCallFirstTwoArgs("categoryItemProp('species_cat', propName, code)", 'categoryItemProp')).toEqual([
      ['species_cat', null],
    ])
  })

  it('finds multiple calls to the same function in one expression', () => {
    const expression = "categoryItemProp('a_cat', 'p1', code1) + categoryItemProp('b_cat', 'p2', code2)"
    expect(extractCallFirstTwoArgs(expression, 'categoryItemProp')).toEqual([
      ['a_cat', 'p1'],
      ['b_cat', 'p2'],
    ])
  })

  it('handles a call whose argument contains a nested unrelated function call', () => {
    const expression = "categoryItemProp('cat', 'prop', concat(code1, code2))"
    expect(extractCallFirstTwoArgs(expression, 'categoryItemProp')).toEqual([['cat', 'prop']])
  })

  it('returns an empty array when the function is not called', () => {
    expect(extractCallFirstTwoArgs("taxonProp('trees', 'status', code)", 'categoryItemProp')).toEqual([])
  })

  it('returns an empty array for an empty expression', () => {
    expect(extractCallFirstTwoArgs('', 'categoryItemProp')).toEqual([])
  })
})
