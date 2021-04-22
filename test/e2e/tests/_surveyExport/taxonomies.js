import fs from 'fs'
import path from 'path'
import csv from 'csv/lib/sync'

import * as PromiseUtils from '../../../../core/promiseUtils'
import { ExportFile } from '../../../../server/modules/survey/service/surveyExport/exportFile'
import { getSurveyEntry } from '../../downloads/path'
import { taxonomies } from '../../mock/taxonomies'

export const verifyTaxonomies = (survey) =>
  test('Verify taxonomies', async () => {
    const taxonomiesExport = Object.values(getSurveyEntry(survey, ExportFile.taxonomies))
    await expect(taxonomiesExport.length).toBe(Object.values(taxonomies).length)
    await PromiseUtils.each(taxonomiesExport, async (taxonomyExport) => {
      const taxonomy = taxonomies[taxonomyExport.props.name]
      await expect(taxonomyExport.props.descriptions.en).toBe(taxonomy.description)

      // verify taxa
      const taxaFilePath = path.resolve(__dirname, '..', '..', 'resources', `${taxonomy.name}_predefined.csv`)
      const taxa = csv.parse(fs.readFileSync(taxaFilePath), { columns: true, skip_empty_lines: true })

      const taxaExport = getSurveyEntry(survey, ExportFile.taxa({ taxonomyUuid: taxonomyExport.uuid }))
      await expect(taxaExport.length).toBe(taxa.length)

      await PromiseUtils.each(taxaExport, async (taxonExport) => {
        const taxon = taxa.find((_taxon) => _taxon.code === taxonExport.props.code)
        await expect(taxonExport.props.genus).toBe(taxon.genus)
        await expect(taxonExport.props.family).toBe(taxon.family)
        await expect(taxonExport.props.scientificName).toBe(taxon.scientific_name)

        await PromiseUtils.each(taxonExport.vernacularNames, async (vernacularNameExport) => {
          await expect(vernacularNameExport.props.name).toBe(taxon[vernacularNameExport.props.code])
        })
      })
    })
  })
