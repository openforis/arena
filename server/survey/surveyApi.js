const {sendOk, sendErr} = require('../response')

const {createSurvey} = require('./surveyRepository')
const {validateCreateSurvey} = require('./surveyValidator')
const {setUserPref} = require('../user/userRepository')

module.exports.init = app => {

  app.post('/survey', async (req, res) => {
    try {

      const {user, body} = req
      const validation = await validateCreateSurvey(body)

      if (validation.valid) {
        const survey = await createSurvey(user.id, body)
        const userUpdated = await setUserPref(user, 'survey', survey.id)

        res.json({survey})
      } else {
        res.json({validation})
      }

    } catch (err) {
      sendErr(res, err)
    }

  })

}
