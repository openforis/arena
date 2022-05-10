import * as CategoryLevel from '@core/survey/categoryLevel'

const getLabelHeader = ({ language }) => `label_${language}`
const getLevelCodeHeader = ({ level }) => `${CategoryLevel.getName(level)}_code`

export const CategoryExportFile = {
  getLabelHeader,
  getLevelCodeHeader,
}
