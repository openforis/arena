import { Authorizer, Survey, User } from '@openforis/arena-core'

/**
 * Returns true if the user can export the survey with its records, users and activity log:
 * only survey admins and system admins (the users who can manage the survey user groups).
 * @param {User} user - The user exporting the survey.
 * @param {Survey} surveyInfo - The survey info.
 * @returns {boolean} - True if the survey export can include the survey data.
 */
export const canExportSurveyData = (user: User, surveyInfo: Survey): boolean =>
  Authorizer.canExportSurvey(user, surveyInfo) && Authorizer.canManageUserGroups(user, surveyInfo)
