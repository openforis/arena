import { ArenaServer, UnauthorizedError } from '@openforis/arena-server'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import { uuidv4 } from '@core/uuid'

import * as AuthGroupRepository from '@server/modules/auth/repository/authGroupRepository'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as UserManager from '@server/modules/user/manager/userManager'
import * as UserRepository from '@server/modules/user/repository/userRepository'

/**
 * Builds a user that belongs to no group (cannot edit any survey).
 * @param {object} user - User to copy.
 * @returns {object} The user without groups.
 */
export const buildUserWithoutGroups = (user: any) => ({
  ...user,
  uuid: uuidv4(),
  name: 'Outsider',
  email: 'outsider@example.com',
  authGroups: [],
})

/**
 * Creates a persisted non-admin user that is a member of a survey group.
 * @param {object} params - Parameters.
 * @param {object} params.admin - User performing the invitation.
 * @param {number} params.surveyId - Survey id.
 * @param {string} params.groupName - Survey group name (AuthGroup.groupNames).
 * @returns {Promise<any>} The user, with its auth groups.
 */
export const createSurveyMember = async ({
  admin,
  surveyId,
  groupName,
}: {
  admin: any
  surveyId: number
  groupName: string
}): Promise<any> => {
  const surveyInfo = Survey.getSurveyInfo(await SurveyManager.fetchSurveyById({ surveyId, draft: true }))
  const groups = await AuthGroupRepository.fetchSurveyGroups(surveyId)
  const email = `route_permission_${groupName}_${uuidv4()}@openforis.org`
  await UserManager.insertUser({
    user: admin,
    surveyInfo,
    email,
    password: 'test_password',
    status: User.userStatus.ACCEPTED,
    group: groups.find((group: any) => AuthGroup.getName(group) === groupName),
    name: groupName,
  })
  return UserManager.fetchUserByEmail(email)
}

/**
 * Deletes persisted users.
 * @param {object[]} users - Users to delete.
 * @returns {Promise<void>} Resolves when deleted.
 */
export const deleteUsers = async (users: any[]): Promise<void> => {
  for (const user of users) {
    await UserRepository.deleteUser(User.getUuid(user))
  }
}

/**
 * Runs the permission middleware (first handler) of a route.
 * @param {object} params - Parameters.
 * @param {object} params.route - Route with its handlers.
 * @param {object} params.user - Requesting user.
 * @param {number} params.surveyId - Survey id.
 * @returns {Promise<any>} The error passed to next, or undefined when access is granted.
 */
export const runRoutePermission = async ({
  route,
  user,
  surveyId,
}: {
  route: { handlers: any[] } | undefined
  user: any
  surveyId: number
}): Promise<any> => {
  let error: any
  const req = { params: { surveyId: String(surveyId) }, query: {}, body: {}, user }
  await route?.handlers[0](req, {}, (nextError?: any) => {
    error = nextError
  })
  return error
}

/**
 * Checks the survey edit permission of routes: refused (UnauthorizedError, answered 403 by the API error handler) for
 * a user without groups, a data analyst and a data editor; granted to a survey editor, a survey admin and a system
 * admin.
 * @param {object} params - Parameters.
 * @param {object[]} params.routes - Routes to check.
 * @param {object} params.admin - System admin (also the inviter).
 * @param {number} params.surveyId - Survey id.
 * @returns {Promise<void>} Resolves when checked; the created users are deleted.
 */
export const expectEditPermissionOnly = async ({
  routes,
  admin,
  surveyId,
}: {
  routes: ({ handlers: any[] } | undefined)[]
  admin: any
  surveyId: number
}): Promise<void> => {
  // the permission middleware reads the survey through these services; the harness never runs the app bootstrap
  ArenaServer.initServices()
  const { groupNames } = AuthGroup
  const members: any[] = []
  const memberOf = async (groupName: string) => {
    const member = await createSurveyMember({ admin, surveyId, groupName })
    members.push(member)
    return member
  }
  try {
    const refusedUsers = [
      buildUserWithoutGroups(admin),
      await memberOf(groupNames.dataAnalyst),
      await memberOf(groupNames.dataEditor),
    ]
    const allowedUsers = [await memberOf(groupNames.surveyEditor), await memberOf(groupNames.surveyAdmin), admin]
    for (const route of routes) {
      for (const user of refusedUsers) {
        expect(await runRoutePermission({ route, user, surveyId })).toBeInstanceOf(UnauthorizedError)
      }
      for (const user of allowedUsers) {
        expect(await runRoutePermission({ route, user, surveyId })).toBeUndefined()
      }
    }
  } finally {
    await deleteUsers(members)
  }
}
