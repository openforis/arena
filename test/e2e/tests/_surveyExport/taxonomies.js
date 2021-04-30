import fs from 'fs'
import path from 'path'
import csv from 'csv/lib/sync'

import * as PromiseUtils from '../../../../core/promiseUtils'
import { ExportFile } from '../../../../server/modules/survey/service/surveyExport/exportFile'
import { getSurveyEntry } from '../../paths'
import { taxonomies } from '../../mock/taxonomies'
import { getProps } from './_surveyUtils'

export const verifyTaxonomies = (survey) =>
  test('Verify taxonomies', async () => {
    const taxonomiesExport = Object.values(getSurveyEntry(survey, ExportFile.taxonomies))
    await expect(taxonomiesExport.length).toBe(Object.values(taxonomies).length)
    await PromiseUtils.each(taxonomiesExport, async (taxonomyExport) => {
      const taxonomyExportProps = getProps(taxonomyExport)
      const taxonomy = taxonomies[taxonomyExportProps.name]
      await expect(taxonomyExportProps.descriptions.en).toBe(taxonomy.description)

      // verify taxa
      const taxaFilePath = path.resolve(__dirname, '..', '..', 'resources', `${taxonomy.name}_predefined.csv`)
      const taxa = csv.parse(fs.readFileSync(taxaFilePath), { columns: true, skip_empty_lines: true })

      const taxaExport = getSurveyEntry(survey, ExportFile.taxa({ taxonomyUuid: taxonomyExport.uuid }))
      await expect(taxaExport.length).toBe(taxa.length)

      await PromiseUtils.each(taxaExport, async (taxonExport) => {
        const taxonExportProps = getProps(taxonExport)
        const taxonExpected = taxa.find((_taxon) => _taxon.code === taxonExportProps.code)
        await expect(taxonExportProps.genus).toBe(taxonExpected.genus)
        await expect(taxonExportProps.family).toBe(taxonExpected.family)
        await expect(taxonExportProps.scientificName).toBe(taxonExpected.scientific_name)

        await PromiseUtils.each(taxonExport.vernacularNames, async (vernacularNameExport) => {
          const vernacularNameExportProps = getProps(vernacularNameExport)
          const vernacularLangCode = vernacularNameExportProps.code
          const expectedVernacularName = taxonExpected[vernacularLangCode]
          await expect(vernacularNameExportProps.name).toBe(expectedVernacularName)
        })
      })
    })
  })
