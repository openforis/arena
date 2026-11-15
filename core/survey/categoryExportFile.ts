import type { CategoryLevel as ArenaCategoryLevel } from '@openforis/arena-core'

import * as CategoryLevel from '@core/survey/categoryLevel'
import { ExtraPropDef, ExtraPropDefItem } from './extraPropDef'

const geometryPointColumnsSuffixes = ['_x', '_y', '_srs']

const getDescriptionHeader = ({ language }: { language: string }): string => `description_${language}`
const getLabelHeader = ({ language }: { language: string }): string => `label_${language}`
const getLevelCodeHeader = ({ level, flat = false }: { level?: ArenaCategoryLevel; flat?: boolean }): string =>
  flat ? 'code' : `${CategoryLevel.getName(level)}_code`
const getExtraPropHeaders = ({ extraPropDef }: { extraPropDef: ExtraPropDefItem }): string[] => {
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
