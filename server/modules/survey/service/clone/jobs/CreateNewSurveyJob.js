import { DBMigrator } from '@openforis/arena-server'

import Job from '@server/job/job'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as SurveyRepository from '@server/modules/survey/repository/surveyRepository'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as UserRepository from '@server/modules/user/repository/userRepository'
import * as AuthGroupRepository from '@server/modules/auth/repository/authGroupRepository'
import * as UserManager from '@server/modules/user/manager/userManager'
import * as AuthGroup from '@core/auth/authGroup'

export default class CreateNewSurveyJob extends Job {
  constructor(params) {
    super('CloneSurveyJob', params)
  }

  async execute() {
    const { surveyId: clonedSurveyId, surveyInfo: surveyInfoDest, user } = this.context
    const surveySource = await SurveyManager.fetchSurveyById(clonedSurveyId, true, false, this.tx)
    const surveyInfoSource = Survey.getSurveyInfo(surveySource)

    const newSurveyInfo = Survey.newSurvey({
      [Survey.infoKeys.ownerUuid]: User.getUuid(user),
      [Survey.infoKeys.name]: Survey.getName(surveyInfoDest) || `clone_${Survey.getName(surveyInfoSource)}`,
      [Survey.infoKeys.languages]: Survey.getLanguages(surveyInfoSource),
      [Survey.infoKeys.labels]: Survey.getLabels(surveyInfoDest) || Survey.getLabels(surveyInfoSource),
      [Survey.infoKeys.template]: Survey.isTemplate(surveyInfoDest),
    })

    let surveyInfo = await SurveyRepository.insertSurvey(newSurveyInfo, this.tx)
    const surveyId = Survey.getIdSurveyInfo(surveyInfo)
    await DBMigrator.migrateSurveySchema(surveyId)

    const userUpdated = User.assocPrefSurveyCurrentAndCycle(surveyId, Survey.cycleOneKey)(user)
    await UserRepository.updateUserPrefs(userUpdated, this.tx)

    const authGroups = await AuthGroupRepository.createSurveyGroups(
      surveyId,
      Survey.getAuthGroups(surveyInfoSource) || Survey.getDefaultAuthGroups(),
      this.tx
    )

    surveyInfo = Survey.assocAuthGroups(authGroups)(surveyInfo)

    if (!User.isSystemAdmin(user)) {
      await UserManager.addUserToGroup(
        user,
        surveyId,
        AuthGroup.getUuid(Survey.getAuthGroupAdmin(surveyInfo)),
        User.getUuid(user),
        this.tx
      )
    }

    this.setContext({ newSurveyId: surveyId, surveyInfo, surveyInfoSource })
  }
}
