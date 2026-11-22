import type { ArenaUser } from '@openforis/arena-core'
type UserServiceLike = { updateUserPrefs: (options: { userToUpdate: ArenaUser }) => Promise<any> }

/**
 * Builds the user service with a working `updateUserPrefs`. The one arena-server registers throws, so a login with
 * `includeSurvey` whose current survey cannot be loaded (deleted, no access) would crash the worker when it clears the
 * survey from the prefs of the user.
 * @param {object} baseService - User service registered by arena-server.
 * @param {Function} updateUserPrefs - Updates the prefs of a user and returns the user with its auth groups (its SQL
 *   never writes nor returns the server-only prefs).
 * @returns {object} The base service with `updateUserPrefs` replaced.
 */
export const createUserServiceWithPrefsUpdate = <S extends UserServiceLike>(
  baseService: S,
  updateUserPrefs: (userToUpdate: ArenaUser) => Promise<any>
): S => ({
  ...baseService,
  updateUserPrefs: ({ userToUpdate }) => updateUserPrefs(userToUpdate),
})
