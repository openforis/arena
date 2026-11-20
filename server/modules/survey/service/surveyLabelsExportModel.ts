const labelColumnPrefix = 'label_'
const descriptionColumnPrefix = 'description_'
const getLabelColumn = (langCode: any) => `${labelColumnPrefix}${langCode}`
const getDescriptionColumn = (langCode: any) => `${descriptionColumnPrefix}${langCode}`

export const SurveyLabelsExportModel = {
  labelColumnPrefix,
  descriptionColumnPrefix,
  getLabelColumn,
  getDescriptionColumn,
}
