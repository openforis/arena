const groupNames = {
  surveyAdmin: 'survey Admin',
  surveyEditor: 'surveyEditor',
  dataEditor: 'dataEditor',
  dataCleanser: 'dataCleanser',
  dataAnalyst: 'dataAnalyst',
  guest: 'guest',
}

const getDefaultSurveyGroups = (surveyName, lang) => [
  {
    name: groupNames.surveyAdmin,
    labels: {[lang]: 'Survey administrators'},
    descriptions: {[lang]: `Administrators of the ${surveyName} survey`},
  },
  {
    name: groupNames.surveyEditor,
    labels: {en: 'Survey editors'},
    descriptions: {[lang]: `Editors of the ${surveyName} survey`},
  },
  {
    name: groupNames.dataEditor,
    labels: {en: 'Data editors'},
    descriptions: {[lang]: `Data editors of the ${surveyName} survey`},
  },
  {
    name: groupNames.dataCleanser,
    labels: {en: 'Data cleansers'},
    descriptions: {[lang]: `Data cleansers of the ${surveyName} survey`},
  },
  {
    name: groupNames.dataAnalyst,
    labels: {en: 'Data analysts'},
    descriptions: {[lang]: `Data analysts of the ${surveyName} survey`},
  }
]

module.exports = {
  groupNames,
  getDefaultSurveyGroups
}
