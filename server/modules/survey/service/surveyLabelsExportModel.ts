const labelColumnPrefix = 'label_'
const descriptionColumnPrefix = 'description_'
const getLabelColumn = (langCode: string) => `${labelColumnPrefix}${langCode}`
const getDescriptionColumn = (langCode: string) => `${descriptionColumnPrefix}${langCode}`

export const SurveyLabelsExportModel = {
  labelColumnPrefix,
  descriptionColumnPrefix,
  getLabelColumn,
  getDescriptionColumn,
}
