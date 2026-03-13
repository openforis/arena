import { getLanguageISO639part2Label } from '@core/app/languages'
import * as Taxonomy from '@core/survey/taxonomy'
import { ExtraPropDef } from '@core/survey/extraPropDef'

const templateExtraValueByType = {
  [ExtraPropDef.dataTypes.number]: 123,
  [ExtraPropDef.dataTypes.text]: 'Text Value',
  [ExtraPropDef.dataTypes.geometryPoint]: 'POINT(12.48902 41.88302)',
}

const generateTemplate = ({ taxonomy }) => {
  const vernacularLanguageCodes = Taxonomy.getVernacularLanguageCodes(taxonomy)
  const extraPropsDefsArray = Taxonomy.getExtraPropsDefsArray(taxonomy)

  return [
    {
      code: 'ACA_DEA',
      family: 'Fabaceae',
      genus: 'Acacia',
      scientific_name: 'Acacia dealbata',
      ...vernacularLanguageCodes.reduce(
        (acc, languageCode) => ({
          ...acc,
          [languageCode]: `Vernacular name (${getLanguageISO639part2Label(languageCode)})`,
        }),
        {}
      ),
      ...extraPropsDefsArray.reduce(
        (acc, extraPropDef) => ({
          ...acc,
          [ExtraPropDef.getName(extraPropDef)]: templateExtraValueByType[ExtraPropDef.getDataType(extraPropDef)],
        }),
        {}
      ),
    },
  ]
}

export const TaxonomyImportTemplateGenerator = {
  generateTemplate,
}
