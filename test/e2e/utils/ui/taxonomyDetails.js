import { button, click, toRightOf, writeIntoTextBox } from '../api'

const selectors = {
  name: () => toRightOf('Taxonomy list name'),
  close: () => button({ class: 'btn-close' }),
}

export const writeTaxonomyName = async (text) => writeIntoTextBox({ text, selector: selectors.name() })

export const clickTaxonomyButtonClose = async () => click(selectors.close())
