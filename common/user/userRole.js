const ADMINISTRATOR = 'administrator'
const SURVEY_MANAGER = 'surveyManager'
const DATA_ENTRY = 'dataEntry'
const DATA_ANALYSIS = 'dataAnalysis'

const administrator = {
  role: ADMINISTRATOR
}
const surveyManager = {
  role: SURVEY_MANAGER
}
const dataEntry = {
  role: DATA_ENTRY
}
const dataAnalysis = {
  role: DATA_ANALYSIS
}

const userRoles = {
  administrator,
  surveyManager,
  dataEntry,
  dataAnalysis,

  toArray: () => [
    administrator,
    surveyManager,
    dataEntry,
    dataAnalysis
  ]

}

module.exports = {
  userRoles
}