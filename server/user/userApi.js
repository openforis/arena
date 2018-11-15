const {getRestParam} = require('../serverUtils/request')
const {sendOk, sendErr} = require('../serverUtils/response')

const {updateUserPref} = require('./userManager')

module.exports.init = app => {

  // ==== UPDATE
  app.post('/user/:userId/pref/:name/:value', async (req, res) => {
    try {
      const {user} = req

      const userId = getRestParam(req, 'userId')
      const name = getRestParam(req, 'name')
      const value = getRestParam(req, 'value')

      if (user.id !== userId) {
        throw new Error('User not allowed to change pref')
      }

      await updateUserPref(user, name, value)

      sendOk(res)
    } catch (e) {
      sendErr(res, e)
    }

  })
}