const {getRestParam, getJsonParam} = require('../serverUtils/request')
const {sendOk, sendErr} = require('../serverUtils/response')

const {updateUserPref, fetchUsers} = require('./userManager')

module.exports.init = app => {
  // === READ
  app.get('/users', async(req, res) => {
    try {
      const limit = getRestParam(req, 'limit')
      const offset = getRestParam(req, 'offset', 0)
      const filter = getJsonParam(req, 'filter')

      const users = await fetchUsers(filter, limit, offset)

      res.json(users)
    } catch (err) {
      sendErr(res, err)
    }
  })

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