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
    const { surveyIdSource, surveyInfoTarget: surveyInfoTargetParam, user } = this.context
    const surveySource = await SurveyManager.fetchSurveyById(surveyIdSource, true, false, this.tx)
    const surveyInfoSource = Survey.getSurveyInfo(surveySource)

    const surveyInfoTarget = Survey.newSurvey({
      [Survey.infoKeys.ownerUuid]: User.getUuid(user),
      [Survey.infoKeys.name]: Survey.getName(surveyInfoTargetParam) || `clone_${Survey.getName(surveyInfoSource)}`,
      [Survey.infoKeys.languages]: Survey.getLanguages(surveyInfoSource),
      [Survey.infoKeys.labels]: Survey.getLabels(surveyInfoTargetParam) || Survey.getLabels(surveyInfoSource),
      [Survey.infoKeys.template]: Survey.isTemplate(surveyInfoTargetParam),
    })

    let surveyInfoTargetInserted = await SurveyRepository.insertSurvey(surveyInfoTarget, this.tx)
    const surveyIdTarget = Survey.getIdSurveyInfo(surveyInfoTargetInserted)
    await DBMigrator.migrateSurveySchema(surveyIdTarget)

    const userUpdated = User.assocPrefSurveyCurrentAndCycle(surveyIdTarget, Survey.cycleOneKey)(user)
    await UserRepository.updateUserPrefs(userUpdated, this.tx)

    const authGroups = await AuthGroupRepository.createSurveyGroups(
      surveyIdTarget,
      Survey.getAuthGroups(surveyInfoSource) || Survey.getDefaultAuthGroups(),
      this.tx
    )

    surveyInfoTargetInserted = Survey.assocAuthGroups(authGroups)(surveyInfoTargetInserted)

    if (!User.isSystemAdmin(user)) {
      await UserManager.addUserToGroup(
        user,
        surveyIdTarget,
        AuthGroup.getUuid(Survey.getAuthGroupAdmin(surveyInfoTargetInserted)),
        User.getUuid(user),
        this.tx
      )
    }

    this.setContext({ surveyIdTarget, surveyInfoTarget: surveyInfoTargetInserted, surveyInfoSource })
  }
}
