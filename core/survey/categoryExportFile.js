import * as CategoryLevel from '@core/survey/categoryLevel'

const getDescriptionHeader = ({ language }) => `description_${language}`
const getLabelHeader = ({ language }) => `label_${language}`
const getLevelCodeHeader = ({ level }) => `${CategoryLevel.getName(level)}_code`

export const CategoryExportFile = {
  getDescriptionHeader,
  getLabelHeader,
  getLevelCodeHeader,
}
