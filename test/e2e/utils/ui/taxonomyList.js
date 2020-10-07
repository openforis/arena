import { click, expectExists, toRightOf } from '../api'

export const editTaxonomy = async ({ taxonomyName }) => {
  await click('edit', toRightOf(taxonomyName))
  await expectExists({ selector: '.taxonomy' })
}

export const expectTaxonomyIsInvalid = async ({ taxonomyName }) =>
  expectExists({ text: 'Invalid', relativeSelectors: [toRightOf(taxonomyName)] })
