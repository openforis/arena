import { button, click, expectExists, fileSelect, toRightOf, writeIntoTextBox } from '../api'

const selectors = {
  name: () => toRightOf('Taxonomy list name'),
  description: () => ({ id: 'taxonomy-description-en' }),
  close: () => button({ class: 'btn-close' }),
}

export const writeTaxonomyName = async (text) => writeIntoTextBox({ text, selector: selectors.name() })

export const writeTaxonomyDescription = async ({ text }) =>
  writeIntoTextBox({ text, selector: selectors.description() })

export const selectTaxonomyFileToImport = async ({ fileName }) =>
  fileSelect({ inputFileId: 'taxonomy-upload-input', fileName })

export const expectTaxonomyTaxaEmpty = async () => expectExists({ selector: '.table__empty-rows' })

export const clickTaxonomyButtonClose = async () => click(selectors.close())
