const {roles} = require('../../common/group/defaults')

const getDefaultSurveyGroups = (surveyName, lang) => [
  {
    role: roles.surveyAdmin,
    labels: {[lang]: 'Survey administrators'},
    descriptions: {[lang]: `Administrators of the ${surveyName} survey`},
    dataCondition: null,
  }, {
    role: roles.surveyEditor,
    labels: {en: 'Survey editors'},
    descriptions: {[lang]: `Editors of the ${surveyName} survey`},
    dataCondition: null,
  }, {
    role: roles.dataEditor,
    labels: {en: 'Data editors'},
    descriptions: {[lang]: `Data editors of the ${surveyName} survey`},
    dataCondition: null,
  }, {
    role: roles.dataCleanser,
    labels: {en: 'Data cleansers'},
    descriptions: {[lang]: `Data cleansers of the ${surveyName} survey`},
    dataCondition: null,
  }, {
    role: roles.dataAnalyst,
    labels: {en: 'Data analysts'},
    descriptions: {[lang]: `Data analysts of the ${surveyName} survey`},
    dataCondition: null,
  }
]

module.exports = {
  getDefaultSurveyGroups
}
