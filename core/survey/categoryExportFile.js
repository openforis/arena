import * as CategoryLevel from '@core/survey/categoryLevel'
import { ExtraPropDef } from './extraPropDef'

const geometryPointColumnsSuffixes = ['_x', '_y', '_srs']

const getDescriptionHeader = ({ language }) => `description_${language}`
const getLabelHeader = ({ language }) => `label_${language}`
const getLevelCodeHeader = ({ level }) => `${CategoryLevel.getName(level)}_code`
const getExtraPropHeaders = ({ extraPropDef }) => {
  const extraPropName = ExtraPropDef.getName(extraPropDef)
  if (ExtraPropDef.getDataType(extraPropDef) === ExtraPropDef.dataTypes.geometryPoint) {
    return geometryPointColumnsSuffixes.map((suffix) => extraPropName + suffix)
  }
  return [extraPropName]
}

export const CategoryExportFile = {
  geometryPointColumnsSuffixes,
  getDescriptionHeader,
  getLabelHeader,
  getLevelCodeHeader,
  getExtraPropHeaders,
}
