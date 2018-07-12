const {
  surveyStatus
} = require('../../common/survey/survey')

const getPath = path =>
  `/surveyDashboard/:surveyId/${path}`

const init = app => {

  //survey section
  app.get(getPath('survey'), (req, res) => {
    const survey = {
      id: 1,
      name: 'Italian NFI 2020',
      countryIso: 'ITA',
      ownerId: 1,
      addedTime: new Date().toISOString(),
      version: {
        id: 1,
        addedTime: new Date().toISOString(),
        updatedTime: new Date().toISOString(),
      },
      draftVersion: {
        id: 2,
        addedTime: new Date().toISOString(),
        updatedTime: new Date().toISOString(),
      }
    }
    res.json({survey})
  })

}

module.exports = {
  init
}