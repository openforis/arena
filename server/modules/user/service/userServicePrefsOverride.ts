import { omitServerOnlyPrefsFromUser } from '@server/modules/user/serverOnlyPrefs'

type UserServiceLike = { updateUserPrefs: (options: { userToUpdate: any }) => Promise<any> }

/**
 * Builds the user service with a working `updateUserPrefs`. The one arena-server registers throws, so a login with
 * `includeSurvey` whose current survey cannot be loaded (deleted, no access) would crash the worker when it clears the
 * survey from the prefs of the user.
 * @param {object} baseService - User service registered by arena-server.
 * @param {Function} updateUserPrefs - Updates the prefs of a user and returns the user with its auth groups.
 * @returns {object} The base service with `updateUserPrefs` replaced.
 */
export const createUserServiceWithPrefsUpdate = <S extends UserServiceLike>(
  baseService: S,
  updateUserPrefs: (userToUpdate: any) => Promise<any>
): S => ({
  ...baseService,
  // the AI prefs are written by their own routes only: they are never part of this write
  updateUserPrefs: ({ userToUpdate }) => updateUserPrefs(omitServerOnlyPrefsFromUser(userToUpdate)),
})
