import path from 'path'

import { ExportFile } from '../../../../server/modules/survey/service/surveyExport/exportFile'
import { getSurveyEntry } from '../../paths'
import { taxonomies } from '../../mock/taxonomies'
import { getProps } from './_surveyUtils'
import { parseCsvAsync } from '../../../utils/csvUtils'

const vernacularLanguageCodeMap = { en: 'eng', sw: 'swa' }

export const verifyTaxonomies = (survey) =>
  test('Verify taxonomies', async () => {
    const taxonomiesExport = Object.values(getSurveyEntry(survey, ExportFile.taxonomies))
    await expect(taxonomiesExport.length).toBe(Object.values(taxonomies).length)
    for (const taxonomyExport of taxonomiesExport) {
      const taxonomyExportProps = getProps(taxonomyExport)
      const taxonomy = taxonomies[taxonomyExportProps.name]
      await expect(taxonomyExportProps.descriptions.en).toBe(taxonomy.description)

      // verify taxa
      const taxaFilePath = path.resolve(__dirname, '..', '..', 'resources', `${taxonomy.name}_predefined.csv`)
      const taxa = await parseCsvAsync(taxaFilePath)

      const taxaExport = getSurveyEntry(survey, ExportFile.taxa({ taxonomyUuid: taxonomyExport.uuid }))
      await expect(taxaExport.length).toBe(taxa.length)

      for (const taxonExport of taxaExport) {
        const taxonExportProps = getProps(taxonExport)
        const taxonExpected = taxa.find((_taxon) => _taxon.code === taxonExportProps.code)
        await expect(taxonExportProps.genus).toBe(taxonExpected.genus)
        await expect(taxonExportProps.family).toBe(taxonExpected.family)
        await expect(taxonExportProps.scientificName).toBe(taxonExpected.scientific_name)

        for (const vernacularNameExport of Object.values(taxonExport.vernacularNames ?? {}).flat()) {
          const vernacularNameExportProps = getProps(vernacularNameExport)
          const vernacularLangCode = vernacularNameExportProps.code
          const expectedVernacularName =
            taxonExpected[vernacularLangCode] ?? taxonExpected[vernacularLanguageCodeMap[vernacularLangCode]]
          await expect(vernacularNameExportProps.name).toBe(expectedVernacularName)
        }
      }
    }
  })
