const roles = {
  surveyAdmin: 'survey Admin',
  surveyEditor: 'surveyEditor',
  dataEditor: 'dataEditor',
  dataCleanser: 'dataCleanser',
  dataAnalyst: 'dataAnalyst',
  guest: 'guest',
}

const defaultSteps = {
  '1': {name: 'entry'},
  '2': {name: 'cleansing', prev: '1'},
  '3': {name: 'analysis', prev: '2'},
}

module.exports = {
  roles
}
