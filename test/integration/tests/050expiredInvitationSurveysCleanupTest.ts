import * as Survey from '@core/survey/survey'
import * as AuthGroup from '@core/auth/authGroup'
import * as User from '@core/user/user'

import { db } from '@server/db/db'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as UserManager from '@server/modules/user/manager/userManager'

import { getContextUser } from '../config/context'

// Surveys created accepting an access request can be deleted only when the invited user never logged in
// (expired invitation) and the survey has not been modified since the invitation (activity log could be disabled).

type TestItem = { surveyId: number; userUuid: string }

const invitationAgeDays = 8 // invitations expire after 1 week
const createdItems: TestItem[] = []

const createSurveyWithInvitedUser = async (params: {
  label: string
  invitedDaysAgo?: number
  modifiedAfterInvitation?: string
}): Promise<TestItem> => {
  const { label, invitedDaysAgo = invitationAgeDays, modifiedAfterInvitation = '0 MINUTES' } = params
  const contextUser = getContextUser()
  const name = `expired_inv_${label}_${Date.now()}`

  const survey = await SurveyManager.insertSurvey({
    user: contextUser,
    surveyInfo: Survey.newSurvey({ ownerUuid: User.getUuid(contextUser), name, label: name, languages: ['en'] }),
    updateUserPrefs: false,
  })
  const surveyId: number = Survey.getId(survey)
  const surveyUuid: string = Survey.getUuid(Survey.getSurveyInfo(survey))

  const userUuid: string = await db.one(
    `INSERT INTO "user" (name, email, status)
    VALUES ($1, $2, '${User.userStatus.INVITED}')
    RETURNING uuid`,
    [name, `${name}@openforis-arena.org`],
    (row: { uuid: string }) => row.uuid
  )
  const item = { surveyId, userUuid }
  createdItems.push(item)

  await db.none(
    `INSERT INTO auth_group_user (user_uuid, group_uuid)
    SELECT $1, g.uuid
    FROM auth_group g
    WHERE g.survey_uuid = $2 AND g.name = '${AuthGroup.groupNames.surveyAdmin}'`,
    [userUuid, surveyUuid]
  )
  const invitedDate = `timezone('UTC', now()) - INTERVAL '${invitedDaysAgo} DAYS'`
  await db.none(
    `INSERT INTO user_invitation (user_uuid, survey_uuid, invited_by, invited_date)
    VALUES ($1, $2, $3, ${invitedDate})`,
    [userUuid, surveyUuid, User.getUuid(contextUser)]
  )
  await db.none(
    `UPDATE survey
    SET owner_uuid = $2, date_modified = ${invitedDate} + INTERVAL '${modifiedAfterInvitation}'
    WHERE id = $1`,
    [surveyId, userUuid]
  )
  return item
}

describe('Expired invitations: untouched surveys cleanup', () => {
  afterAll(async () => {
    for (const { surveyId, userUuid } of createdItems) {
      await SurveyManager.deleteSurvey(surveyId, { deleteUserPrefs: true })
      await UserManager.deleteUser(userUuid)
    }
  })

  test('survey never modified after the invitation is selected', async () => {
    const { surveyId } = await createSurveyWithInvitedUser({ label: 'untouched' })
    const surveyIds = await UserManager.fetchSurveyIdsOfExpiredInvitationUsers()
    expect(surveyIds).toContain(surveyId)
  })

  test('survey modified shortly after the invitation is selected', async () => {
    const { surveyId } = await createSurveyWithInvitedUser({ label: 'close', modifiedAfterInvitation: '2 MINUTES' })
    const surveyIds = await UserManager.fetchSurveyIdsOfExpiredInvitationUsers()
    expect(surveyIds).toContain(surveyId)
  })

  test('survey modified after the invitation is not selected', async () => {
    const { surveyId } = await createSurveyWithInvitedUser({ label: 'modified', modifiedAfterInvitation: '1 DAY' })
    const surveyIds = await UserManager.fetchSurveyIdsOfExpiredInvitationUsers()
    expect(surveyIds).not.toContain(surveyId)
  })

  test('survey of a user with a not expired invitation is not selected', async () => {
    const { surveyId } = await createSurveyWithInvitedUser({ label: 'recent', invitedDaysAgo: 2 })
    const surveyIds = await UserManager.fetchSurveyIdsOfExpiredInvitationUsers()
    expect(surveyIds).not.toContain(surveyId)
  })
})
