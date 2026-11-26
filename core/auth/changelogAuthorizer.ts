import * as User from '@core/user/user'

/**
 * Returns true if the user can view the changelog: system admins, survey managers and survey admins.
 * @returns {boolean} True if the changelog is visible to the user.
 */
export const canViewChangelog = (user: any): boolean =>
  User.isSystemAdmin(user) || User.isSurveyManager(user) || User.isSurveyAdminOfSomeSurvey(user)
