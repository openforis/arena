import { omitServerOnlyPrefsFromUser } from '@server/modules/user/serverOnlyPrefs'

/**
 * Builds the response of the current user group route: the user is the one of the request, so its server-only prefs
 * (AI providers with their encrypted keys, AI usage) must not be sent.
 * @param {object} params - Parameters.
 * @param {unknown} params.user - User of the request.
 * @param {unknown} params.userGroup - User group of the user in the survey.
 * @returns {{ user: unknown, userGroup: unknown }} The response body.
 */
export const buildCurrentUserGroupBody = ({ user, userGroup }: { user: unknown; userGroup: unknown }) => ({
  user: omitServerOnlyPrefsFromUser(user),
  userGroup,
})
