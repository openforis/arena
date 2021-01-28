import fs from 'fs'
import path from 'path'

import { CSVReaderSync } from '@server/utils/file/csvReader'
import * as PromiseUtils from '@core/promiseUtils'

import * as Taxonomy from '@core/survey/taxonomy'
import * as Taxon from '@core/survey/taxon'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

import * as Chain from '@common/analysis/processingChain'

import { checkFileAndGetContent } from './utils'

// Taxonomies

export const checkTaxon = async ({ taxon, taxonomyMockDataParsedByCode }) => {
  const code = Taxon.getCode(taxon)
  await expect(code).toBe(taxonomyMockDataParsedByCode[code].code)
  await expect(Taxon.getGenus(taxon)).toBe(taxonomyMockDataParsedByCode[code].genus)
  await expect(Taxon.getFamily(taxon)).toBe(taxonomyMockDataParsedByCode[code].family)

  await expect(Taxon.getScientificName(taxon)).toBe(taxonomyMockDataParsedByCode[code].scientific_name)

  const vernacularNamesByLang = Taxon.getVernacularNames(taxon)

  await expect((vernacularNamesByLang?.eng || []).map(TaxonVernacularName.getName).join(' / ') || '').toBe(
    taxonomyMockDataParsedByCode[code].eng || ''
  )
  await expect((vernacularNamesByLang?.swa || []).map(TaxonVernacularName.getName).join(' / ') || '').toBe(
    taxonomyMockDataParsedByCode[code].swa || ''
  )
}

export const checkTaxonomies = async ({ surveyExtractedPath }) => {
  const taxonomies = await checkFileAndGetContent({
    filePath: path.join(surveyExtractedPath, 'taxonomies', 'taxonomies.json'),
  })

  // If we add more taxonomies this should be refactorized
  await expect(taxonomies.length).toBe(1)

  const taxonomyUuid = Chain.getUuid(taxonomies[0])
  await expect(Taxonomy.getName(taxonomies[0])).toBe('tree_species')
  await expect(Taxonomy.getDescription('en')(taxonomies[0])).toBe('Tree Species List')

  const taxonomy = await checkFileAndGetContent({
    filePath: path.join(surveyExtractedPath, 'taxonomies', `${taxonomyUuid}.json`),
  })

  const taxonomyMockData = fs.readFileSync(
    path.resolve(__dirname, '..', '..', 'resources', 'taxonomies', 'species list valid with predefined.csv')
  )
  const taxonomyMockDataParsed = CSVReaderSync(taxonomyMockData, { columns: true, skip_empty_lines: true })

  const taxonomyMockDataParsedByCode = taxonomyMockDataParsed.reduce(
    (acc, taxon) => ({ ...acc, [taxon.code]: { ...taxon } }),
    {}
  )
  const taxonomyTaxaByCode = taxonomy.reduce((acc, taxon) => ({ ...acc, [Taxon.getCode(taxon)]: { ...taxon } }), {})

  await expect(Object.keys(taxonomyMockDataParsedByCode).sort()).toEqual(Object.keys(taxonomyTaxaByCode).sort())
  await PromiseUtils.each(taxonomy, async (taxon) => checkTaxon({ taxon, taxonomyMockDataParsedByCode }))
}
