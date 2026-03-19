import { getLanguageISO639part2Label } from '@core/app/languages'
import { DataImportTemplateTypes } from '@core/dataImport'
import { ExtraPropDef } from '@core/survey/extraPropDef'
import * as Taxonomy from '@core/survey/taxonomy'

const VERNACULAR_LANGUAGE_CODE_SYNONYM = 'lat'

const templateExtraValueByType = {
  [ExtraPropDef.dataTypes.number]: 123,
  [ExtraPropDef.dataTypes.text]: 'Text Value',
  [ExtraPropDef.dataTypes.geometryPoint]: 'POINT(12.48902 41.88302)',
}

const genericVernacularLanguageCodes = [VERNACULAR_LANGUAGE_CODE_SYNONYM, 'eng', 'fra', 'spa']
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
      code: 'ACACIA/DEALB',
      family: 'Fabaceae',
      genus: 'Acacia',
      scientific_name: 'Acacia dealbata',
      ...vernacularLanguageCodes.reduce(
        (acc, languageCode) => ({
          ...acc,
          [languageCode]:
            languageCode === VERNACULAR_LANGUAGE_CODE_SYNONYM
              ? 'Synonym name(s)'
              : `Vernacular name(s) (${getLanguageISO639part2Label(languageCode)})`,
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
    {
      code: 'CEIBA/PENTA',
      family: 'Bombacaceae',
      genus: 'Ceiba',
      scientific_name: 'Ceiba pentandra',
      eng: 'Kapok tree',
      fra: 'Fromager',
    },
    {
      code: 'PARAS/FALCA',
      family: 'Leguminosae',
      genus: 'Paraserianthes',
      scientific_name: 'Paraserianthes falcataria',
      lat: 'Albizia falcataria / Falcataria moluccana',
    },
  ]
}

export const TaxonomyImportTemplateGenerator = {
  generateTemplate,
}
