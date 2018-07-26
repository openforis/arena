const {sendOk, sendErr} = require('../response')
const {createSurvey} = require('./surveyRepository')

module.exports.init = app => {

  app.post('/survey', async (req, res) => {
    try {
      //check auth

      const {user, body} = req

      const survey = await createSurvey(user.id, body)

      res.json({survey})

    } catch (err) {
      sendErr(res, err)
    }

  })

}
