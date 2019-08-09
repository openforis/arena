const {sendOk} = require('../utils/response')

const {cancelActiveJobByUserUuid} = require('./jobManager')

const User = require('../../common/user/user')

module.exports.init = app => {

  /**
   * ====== DELETE
   */
  app.delete('/jobs/active', async (req, res) => {
    await cancelActiveJobByUserUuid(User.getUuid(req.user))

    sendOk(res)
  })

}