const R = require('ramda')

const Job = require('../../../../../job/job')

const UserManager = require('../../../../user/manager/userManager')
const SurveyPublishJobUtils = require('../surveyPublishJobUtils')

class UserPrefsCycleResetJob extends Job {

  constructor (params) {
    super(UserPrefsCycleResetJob.type, params)
  }

  async execute (tx) {
    this.total = 2

    // 1. find deleted cycles
    this.logDebug(`finding deleted cycles`)
    const cycleKeysDeleted = await SurveyPublishJobUtils.findDeletedCycleKeys(this.surveyId, this.tx)
    this.logDebug(`deleted cycles: ${cycleKeysDeleted}`)
    this.incrementProcessedItems()

    // 2. reset users pref cycle (if among deleted ones)
    if (!R.isEmpty(cycleKeysDeleted)) {
      this.logDebug(`updating users prefs`)
      await UserManager.deleteUsersPrefsCycleDeleted(this.surveyId, cycleKeysDeleted)
      this.logDebug(`users prefs updated`)
    }
    this.incrementProcessedItems()
  }

}

UserPrefsCycleResetJob.type = 'UserPrefsCycleResetJob'

module.exports = UserPrefsCycleResetJob