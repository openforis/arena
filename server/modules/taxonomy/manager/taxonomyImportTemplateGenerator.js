import { getLanguageISO639part2Label } from '@core/app/languages'
import { DataImportTemplateTypes } from '@core/dataImport'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as Taxonomy from '@core/survey/taxonomy'

const templateExtraValueByType = {
  [ExtraPropDef.dataTypes.number]: 123,
  [ExtraPropDef.dataTypes.text]: 'Text Value',
  [ExtraPropDef.dataTypes.geometryPoint]: 'POINT(12.48902 41.88302)',
}

const genericVernacularLanguageCodes = ['eng', 'fra', 'swa']
const genericExtraPropDefsArray = ExtraPropDef.extraDefsToArray({
  text_prop: { dataType: ExtraPropDef.dataTypes.text },
  numeric_prop: { dataType: ExtraPropDef.dataTypes.number },
})

const generateTemplate = ({ taxonomy, templateType }) => {
  const vernacularLanguageCodes =
    templateType === DataImportTemplateTypes.generic
      ? genericVernacularLanguageCodes
      : Taxonomy.getVernacularLanguageCodes(taxonomy)

  const extraPropsDefsArray =
    templateType === DataImportTemplateTypes.generic
      ? genericExtraPropDefsArray
      : Taxonomy.getExtraPropsDefsArray(taxonomy)

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
