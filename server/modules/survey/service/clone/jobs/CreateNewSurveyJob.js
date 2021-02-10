import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as UserRepository from '@server/modules/user/repository/userRepository'
import * as AuthGroupRepository from '@server/modules/auth/repository/authGroupRepository'
import * as UserManager from '@server/modules/user/manager/userManager'
import * as AuthGroup from '@core/auth/authGroup'

import { migrateSurveySchema } from '@server/db/migration/dbMigrator'

export default class CreateNewSurveyJob extends Job {
  constructor(params) {
    super('CloneSurveyJob', params)
  }

  async execute() {
    const { surveyId: clonedSurveyId, surveyInfo: surveyInfoData, user } = this.context
    const clonedSurvey = await SurveyManager.fetchSurveyById(clonedSurveyId, true, false, this.tx)
    const clonedSurveyInfo = Survey.getSurveyInfo(clonedSurvey)

    const newSurveyInfo = Survey.newSurvey({
      [Survey.infoKeys.ownerUuid]: User.getUuid(user),
      [Survey.infoKeys.name]: Survey.getName(surveyInfoData) || `clone_${Survey.getName(clonedSurveyInfo)}`,
      [Survey.infoKeys.languages]: Survey.getLanguages(clonedSurveyInfo),
      [Survey.infoKeys.labels]: Survey.getLabels(surveyInfoData) || Survey.getLabels(clonedSurveyInfo),
    })

    const surveyInfo = await SurveyRepository.insertSurvey(newSurveyInfo, this.tx)
    const surveyId = Survey.getIdSurveyInfo(surveyInfo)
    await migrateSurveySchema(surveyId)

    const userUpdated = User.assocPrefSurveyCurrentAndCycle(surveyId, Survey.cycleOneKey)(user)
    await UserRepository.updateUserPrefs(userUpdated, this.tx)

    const authGroups = Survey.getAuthGroups(surveyInfo)

    surveyInfo.authGroups = await AuthGroupRepository.createSurveyGroups(surveyId, authGroups, this.tx)

    if (!User.isSystemAdmin(user)) {
      await UserManager.addUserToGroup(
        user,
        surveyId,
        AuthGroup.getUuid(Survey.getAuthGroupAdmin(surveyInfo)),
        User.getUuid(user),
        this.tx
      )
    }

    this.setContext({ newSurveyId: surveyId, surveyInfo })
  }
}
