import fs from 'fs'
import path from 'path'
import csvParseSync from 'csv-parse/lib/sync'

import * as PromiseUtils from '../PromiseUtils'
import { checkFileAndGetContent } from './utils'

// Taxonomies
export const checkTaxon = async ({ taxon, taxonomyMockDataParsedByCode }) => {
  const { code, genus, family, scientificName } = taxon.props
  await expect(code).toBe(taxonomyMockDataParsedByCode[code].code)
  await expect(genus).toBe(taxonomyMockDataParsedByCode[code].genus)
  await expect(family).toBe(taxonomyMockDataParsedByCode[code].family)
  await expect(scientificName).toBe(taxonomyMockDataParsedByCode[code].scientific_name)

  const vernacularNamesByLang = taxon.vernacularNames

  await expect(
    (vernacularNamesByLang?.eng || []).map((vernacularName) => vernacularName.vernacularName).join(' / ') || ''
  ).toBe(taxonomyMockDataParsedByCode[code].eng || '')
  await expect(
    (vernacularNamesByLang?.swa || []).map((vernacularName) => vernacularName.vernacularName).join(' / ') || ''
  ).toBe(taxonomyMockDataParsedByCode[code].swa || '')
}

export const checkTaxonomies = async ({ surveyExtractedPath }) => {
  const taxonomies = await checkFileAndGetContent({
    filePath: path.join(surveyExtractedPath, 'taxonomies', 'taxonomies.json'),
  })

  // If we add more taxonomies this should be refactorized
  await expect(taxonomies.length).toBe(1)

  const { uuid: taxonomyUuid } = taxonomies[0]
  await expect(taxonomies[0].name).toBe('tree_species')
  await expect(taxonomies[0].descriptions.en).toBe('Tree Species List')

  const taxonomy = await checkFileAndGetContent({
    filePath: path.join(surveyExtractedPath, 'taxonomies', `${taxonomyUuid}.json`),
  })

  const taxonomyMockData = fs.readFileSync(
    path.resolve(__dirname, '..', '..', 'resources', 'taxonomies', 'species list valid with predefined.csv')
  )
  const taxonomyMockDataParsed = csvParseSync(taxonomyMockData, { columns: true, skip_empty_lines: true })

  const taxonomyMockDataParsedByCode = taxonomyMockDataParsed.reduce(
    (acc, taxon) => ({ ...acc, [taxon.code]: { ...taxon } }),
    {}
  )
  const taxonomyTaxaByCode = taxonomy.reduce((acc, taxon) => ({ ...acc, [taxon.props.code]: { ...taxon } }), {})

  await expect(Object.keys(taxonomyMockDataParsedByCode).sort()).toEqual(Object.keys(taxonomyTaxaByCode).sort())
  await PromiseUtils.each(taxonomy, async (taxon) => checkTaxon({ taxon, taxonomyMockDataParsedByCode }))
}
