import { button, click, expectExists, expectInputTextToBe, fileSelect, toRightOf, writeIntoTextBox } from '../api'
import { expectTablePagination } from './table'

const selectors = {
  name: () => toRightOf('Taxonomy list name'),
  description: () => ({ id: 'taxonomy-description-en' }),
  close: () => button({ class: 'btn-close' }),
  tableTaxaEmptyRows: () => '.table__empty-rows',
  tableTaxa: () => '.taxonomy__table-container',
}

export const writeTaxonomyName = async ({ text }) => writeIntoTextBox({ text, selector: selectors.name() })

export const writeTaxonomyDescription = async ({ text }) =>
  writeIntoTextBox({ text, selector: selectors.description() })

export const selectTaxonomyFileToImport = async ({ fileName }) =>
  fileSelect({ inputFileId: 'taxonomy-upload-input', fileName })

export const expectTaxonomyNameIs = async ({ name }) =>
  expectInputTextToBe({ expectedText: name, selector: selectors.name() })

export const expectTaxonomyDescriptionIs = async ({ description }) =>
  expectInputTextToBe({ expectedText: description, selector: selectors.description() })

export const expectTaxonomyTaxaEmpty = async () => expectExists({ selector: selectors.tableTaxaEmptyRows() })

export const expectTaxonomyTaxaNotEmpty = async () => expectExists({ selector: selectors.tableTaxa() })

export const expectTaxonomyTaxaTablePagination = async ({ from, to, total }) =>
  expectTablePagination({ from, to, total })

export const clickTaxonomyButtonClose = async () => click(selectors.close())

export const closeTaxonomyEditor = async () => click('Done')
