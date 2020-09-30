import { expectExists, fileSelect, writeIntoTextBox } from '../api'

const selectors = {
  description: () => ({ id: 'taxonomy-description-en' }),
}

export const writeTaxonomyDescription = async ({ text }) =>
  writeIntoTextBox({ text, selector: selectors.description() })

export const selectTaxonomyFileToImport = async ({ fileName }) =>
  fileSelect({ inputFileId: 'taxonomy-upload-input', fileName })

export const expectTaxonomyTaxaEmpty = async () => expectExists({ selector: '.table__empty-rows' })
