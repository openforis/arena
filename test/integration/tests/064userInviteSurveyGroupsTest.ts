import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as UserGroupInvitation from '@core/user/userGroupInvitation'

import { db } from '@server/db/db'
import * as AuthApi from '@server/modules/auth/api/authApi'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as UserManager from '@server/modules/user/manager/userManager'
import * as UserResetPasswordRepository from '@server/modules/user/repository/userResetPasswordRepository'
import * as UserInviteService from '@server/modules/user/service/userInviteService'
import * as UserService from '@server/modules/user/service/userService'

import { getContextUser } from '../config/context'

// Survey users can invite only into the groups of their survey, and can manage the invitation (password reset)
// link of a pending user only when the user has no roles or invitations elsewhere.

const prefix = `invite_groups_${Date.now()}`
const serverUrl = 'https://arena-test.example.org'

type TestSurvey = { surveyId: number; surveyUuid: string }

const surveyIds: number[] = []
const userUuids: string[] = []

let surveyA: TestSurvey
let surveyB: TestSurvey
let adminA: any

const insertSurvey = async (name: string): Promise<TestSurvey> => {
  const contextUser = getContextUser()
  const survey = await SurveyManager.insertSurvey({
    user: contextUser,
    surveyInfo: Survey.newSurvey({ ownerUuid: User.getUuid(contextUser), name, label: name, languages: ['en'] }),
    updateUserPrefs: false,
  })
  const surveyId: number = Survey.getId(survey)
  surveyIds.push(surveyId)
  return { surveyId, surveyUuid: Survey.getUuid(Survey.getSurveyInfo(survey)) }
}

const insertUser = async (name: string, status: string): Promise<string> => {
  const userUuid: string = await db.one(
    `INSERT INTO "user" (name, email, status) VALUES ($1, $2, $3) RETURNING uuid`,
    [name, `${name}@openforis-arena.org`, status],
    (row: { uuid: string }) => row.uuid
  )
  userUuids.push(userUuid)
  return userUuid
}

const addUserToSurveyGroup = ({ userUuid, survey, groupName }: any) =>
  db.none(
    `INSERT INTO auth_group_user (user_uuid, group_uuid)
    SELECT $1, uuid FROM auth_group WHERE survey_uuid = $2 AND name = $3`,
    [userUuid, survey.surveyUuid, groupName]
  )

const addUserToGlobalGroup = ({ userUuid, groupName }: any) =>
  db.none(
    `INSERT INTO auth_group_user (user_uuid, group_uuid)
    SELECT $1, uuid FROM auth_group WHERE survey_uuid IS NULL AND name = $2`,
    [userUuid, groupName]
  )

const insertInvitation = ({ userUuid, survey }: any) =>
  db.none(`INSERT INTO user_invitation (user_uuid, survey_uuid, invited_by) VALUES ($1, $2, $3)`, [
    userUuid,
    survey.surveyUuid,
    User.getUuid(getContextUser()),
  ])

const fetchSurveyGroupUuid = (survey: TestSurvey, groupName: string): Promise<string> =>
  db.one(
    `SELECT uuid FROM auth_group WHERE survey_uuid = $1 AND name = $2`,
    [survey.surveyUuid, groupName],
    (row: { uuid: string }) => row.uuid
  )

// pending user invited to survey A as survey admin
const insertPendingUserInvitedToA = async (name: string): Promise<string> => {
  const userUuid = await insertUser(name, User.userStatus.INVITED)
  await addUserToSurveyGroup({ userUuid, survey: surveyA, groupName: AuthGroup.groupNames.surveyAdmin })
  await insertInvitation({ userUuid, survey: surveyA })
  await UserResetPasswordRepository.insertOrUpdateResetPassword(userUuid)
  return userUuid
}

const inviteToA = ({ user = adminA, email, groupUuid, repeatInvitation = false }: any) =>
  UserInviteService.inviteUsers({
    user,
    surveyId: surveyA.surveyId,
    surveyCycleKey: Survey.cycleOneKey,
    invitation: UserGroupInvitation.newUserGroupInvitation(email, groupUuid),
    serverUrl,
    repeatInvitation,
  })

const fetchResetPasswordUrlInA = ({ user = adminA, userUuid }: any) =>
  UserService.fetchResetPasswordUrl({ user, serverUrl, userUuid, surveyId: surveyA.surveyId })

const fetchUserGroupsInSurvey = (userUuid: string, survey: TestSurvey) =>
  db.map(
    `SELECT g.name FROM auth_group_user gu JOIN auth_group g ON g.uuid = gu.group_uuid
    WHERE gu.user_uuid = $1 AND g.survey_uuid = $2`,
    [userUuid, survey.surveyUuid],
    (row: { name: string }) => row.name
  )

const callAuthUserApi = async (user: any) => {
  const handlers: Record<string, any> = {}
  const register =
    (method: string) =>
    (path: string, ...routeHandlers: any[]) => {
      handlers[`${method} ${path}`] = routeHandlers.at(-1)
    }
  AuthApi.init({ get: register('get'), post: register('post'), put: register('put') })

  let body: any = null
  const res = { json: (data: any) => (body = data) }
  await handlers['get /auth/user']({ user }, res, (error: any) => {
    throw error
  })
  return body
}

describe('User invitations: survey groups and invitation links', () => {
  beforeAll(async () => {
    surveyA = await insertSurvey(`${prefix}_a`)
    surveyB = await insertSurvey(`${prefix}_b`)
    const adminAUuid = await insertUser(`${prefix}_admin_a`, User.userStatus.ACCEPTED)
    await addUserToSurveyGroup({ userUuid: adminAUuid, survey: surveyA, groupName: AuthGroup.groupNames.surveyAdmin })
    adminA = await UserManager.fetchUserByUuid(adminAUuid)
  })

  afterAll(async () => {
    // every survey (and every user) is independent of the others: delete them in parallel
    await Promise.all(surveyIds.map((surveyId) => SurveyManager.deleteSurvey(surveyId, { deleteUserPrefs: true })))
    await Promise.all(userUuids.map((userUuid) => UserManager.deleteUser(userUuid)))
  })

  test('invitation into a group of another survey is rejected', async () => {
    const email = `${prefix}_new@openforis-arena.org`
    const groupUuid = await fetchSurveyGroupUuid(surveyB, AuthGroup.groupNames.surveyAdmin)
    await expect(inviteToA({ email, groupUuid })).rejects.toMatchObject({ key: 'appErrors:userNotAuthorized' })
    expect(await UserManager.fetchUserByEmail(email)).toBeNull()
  })

  test('pending user with roles in another survey cannot be invited by a survey admin', async () => {
    const name = `${prefix}_pending_b`
    const userUuid = await insertUser(name, User.userStatus.INVITED)
    await addUserToSurveyGroup({ userUuid, survey: surveyB, groupName: AuthGroup.groupNames.surveyAdmin })
    await insertInvitation({ userUuid, survey: surveyB })
    const groupUuid = await fetchSurveyGroupUuid(surveyA, AuthGroup.groupNames.surveyAdmin)
    await expect(inviteToA({ email: `${name}@openforis-arena.org`, groupUuid })).rejects.toMatchObject({
      key: 'appErrors:userHasPendingInvitation',
    })
    expect(await fetchUserGroupsInSurvey(userUuid, surveyA)).toEqual([])
  })

  test('pending system admin cannot be invited by a survey admin', async () => {
    const name = `${prefix}_pending_sysadmin`
    const userUuid = await insertUser(name, User.userStatus.INVITED)
    await addUserToGlobalGroup({ userUuid, groupName: AuthGroup.groupNames.systemAdmin })
    const groupUuid = await fetchSurveyGroupUuid(surveyA, AuthGroup.groupNames.surveyAdmin)
    await expect(inviteToA({ email: `${name}@openforis-arena.org`, groupUuid })).rejects.toMatchObject({
      key: 'appErrors:userHasPendingInvitation',
    })
    expect(await fetchUserGroupsInSurvey(userUuid, surveyA)).toEqual([])
  })

  test('invitation cannot be sent again to a user not invited to the survey', async () => {
    const name = `${prefix}_not_invited`
    await insertUser(name, User.userStatus.INVITED)
    const groupUuid = await fetchSurveyGroupUuid(surveyA, AuthGroup.groupNames.surveyAdmin)
    await expect(
      inviteToA({ email: `${name}@openforis-arena.org`, groupUuid, repeatInvitation: true })
    ).rejects.toMatchObject({ key: 'appErrors:userNotInvitedToSurvey' })
  })

  test('invitation link of a user invited only to the survey is returned to the survey admin', async () => {
    const userUuid = await insertPendingUserInvitedToA(`${prefix}_only_a`)
    const url = await fetchResetPasswordUrlInA({ userUuid })
    expect(url.startsWith(`${serverUrl}/guest/resetPassword/`)).toBe(true)
  })

  test('invitation link of a user with roles in another survey is returned only to system admins', async () => {
    const userUuid = await insertPendingUserInvitedToA(`${prefix}_a_and_b`)
    await addUserToSurveyGroup({ userUuid, survey: surveyB, groupName: AuthGroup.groupNames.surveyAdmin })
    await expect(fetchResetPasswordUrlInA({ userUuid })).rejects.toMatchObject({
      key: 'appErrors:userInvitationLinkNotAvailable',
    })
    const url = await fetchResetPasswordUrlInA({ user: getContextUser(), userUuid })
    expect(url.startsWith(`${serverUrl}/guest/resetPassword/`)).toBe(true)
  })

  test('invitation link of a pending system admin is not returned to the survey admin', async () => {
    const userUuid = await insertPendingUserInvitedToA(`${prefix}_a_sysadmin`)
    await addUserToGlobalGroup({ userUuid, groupName: AuthGroup.groupNames.systemAdmin })
    await expect(fetchResetPasswordUrlInA({ userUuid })).rejects.toMatchObject({
      key: 'appErrors:userInvitationLinkNotAvailable',
    })
  })

  test('invitation link without survey is returned only to system admins', async () => {
    const userUuid = await insertPendingUserInvitedToA(`${prefix}_no_survey`)
    await expect(UserService.fetchResetPasswordUrl({ user: adminA, serverUrl, userUuid })).rejects.toMatchObject({
      key: 'appErrors:userNotAuthorized',
    })
  })

  test('current user survey is not returned when the user cannot view it', async () => {
    const userUuid = await insertUser(`${prefix}_auth_user`, User.userStatus.ACCEPTED)
    await addUserToSurveyGroup({ userUuid, survey: surveyA, groupName: AuthGroup.groupNames.dataEditor })
    const user = await UserManager.fetchUserByUuid(userUuid)

    await UserManager.updateUserPrefs(User.assocPrefSurveyCurrent(surveyB.surveyId)(user))
    const bodySurveyB = await callAuthUserApi(await UserManager.fetchUserByUuid(userUuid))
    expect(bodySurveyB.survey).toBeNull()
    expect(User.getPrefSurveyCurrent(bodySurveyB.user)).toBeFalsy()

    await UserManager.updateUserPrefs(User.assocPrefSurveyCurrent(surveyA.surveyId)(user))
    const bodySurveyA = await callAuthUserApi(await UserManager.fetchUserByUuid(userUuid))
    expect(Survey.getId(bodySurveyA.survey)).toBe(surveyA.surveyId)
  })
})
