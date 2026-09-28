import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'

const nodeDefWithDefaultValueExpression = (expression) => ({
  propsAdvanced: {
    defaultValues: [NodeDefExpression.createExpression({ expression })],
  },
})

const nodeDefWithValidationExpression = (expression) => ({
  propsAdvanced: {
    validations: {
      expressions: [NodeDefExpression.createExpression({ expression })],
    },
  },
})

describe('NodeDef.referencesCategoryExtraProp', () => {
  it('matches a literal categoryName/propName call when the propName is in changedPropNames', () => {
    const nodeDef = nodeDefWithDefaultValueExpression("categoryItemProp('species_cat', 'habitat', species)")

    expect(
      NodeDef.referencesCategoryExtraProp({ categoryName: 'species_cat', changedPropNames: new Set(['habitat']) })(
        nodeDef
      )
    ).toBe(true)
  })

  it('conservatively matches when the propName argument is not a literal', () => {
    const nodeDef = nodeDefWithDefaultValueExpression('categoryItemProp("species_cat", propName, species)')

    expect(
      NodeDef.referencesCategoryExtraProp({ categoryName: 'species_cat', changedPropNames: new Set(['diameter']) })(
        nodeDef
      )
    ).toBe(true)
  })

  it('does not match an unrelated category name', () => {
    const nodeDef = nodeDefWithDefaultValueExpression("categoryItemProp('other_cat', 'habitat', species)")

    expect(
      NodeDef.referencesCategoryExtraProp({ categoryName: 'species_cat', changedPropNames: new Set(['habitat']) })(
        nodeDef
      )
    ).toBe(false)
  })

  it('does not match an unchanged prop name on the same category', () => {
    const nodeDef = nodeDefWithDefaultValueExpression("categoryItemProp('species_cat', 'diameter', species)")

    expect(
      NodeDef.referencesCategoryExtraProp({ categoryName: 'species_cat', changedPropNames: new Set(['habitat']) })(
        nodeDef
      )
    ).toBe(false)
  })

  it('does not match a categoryItemProp call that only appears in a validation expression', () => {
    const nodeDef = nodeDefWithValidationExpression("categoryItemProp('species_cat', 'habitat', species) > 0")

    expect(
      NodeDef.referencesCategoryExtraProp({ categoryName: 'species_cat', changedPropNames: new Set(['habitat']) })(
        nodeDef
      )
    ).toBe(false)
  })
})

describe('NodeDef.referencesCategoryExtraPropInValidations', () => {
  it('matches a categoryItemProp call inside a validation expression', () => {
    const nodeDef = nodeDefWithValidationExpression("categoryItemProp('species_cat', 'habitat', species) > 0")

    expect(
      NodeDef.referencesCategoryExtraPropInValidations({
        categoryName: 'species_cat',
        changedPropNames: new Set(['habitat']),
      })(nodeDef)
    ).toBe(true)
  })
})

describe('NodeDef.referencesTaxonomyExtraProp', () => {
  it('matches a literal taxonomyName/propName call when the propName is in changedPropNames', () => {
    const nodeDef = nodeDefWithDefaultValueExpression("taxonProp('trees', 'status', taxon_code)")

    expect(
      NodeDef.referencesTaxonomyExtraProp({ taxonomyName: 'trees', changedPropNames: new Set(['status']) })(nodeDef)
    ).toBe(true)
  })

  it('does not match an unrelated taxonomy name', () => {
    const nodeDef = nodeDefWithDefaultValueExpression("taxonProp('shrubs', 'status', taxon_code)")

    expect(
      NodeDef.referencesTaxonomyExtraProp({ taxonomyName: 'trees', changedPropNames: new Set(['status']) })(nodeDef)
    ).toBe(false)
  })
})
