const labelColumnPrefix = 'label_'
const descriptionColumnPrefix = 'description_'
const getLabelColumn = (langCode) => `${labelColumnPrefix}${langCode}`
const getDescriptionColumn = (langCode) => `${descriptionColumnPrefix}${langCode}`

export const SurveyLabelsExportModel = {
  labelColumnPrefix,
  descriptionColumnPrefix,
  getLabelColumn,
  getDescriptionColumn,
}
