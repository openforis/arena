import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

export const insertUserInvitation = async ({ user, survey, userToInvite }, client = db) =>
  client.one(
    `INSERT INTO user_invitation (user_uuid, survey_uuid, invited_by)
      VALUES ($1, $2, $3)
      RETURNING uuid`,
    [User.getUuid(userToInvite), Survey.getUuid(Survey.getSurveyInfo(survey)), User.getUuid(user)]
  )

export const removeUserInvitation = async ({ survey, userUuidToRemove }, client = db) =>
  client.one(
    `UPDATE user_invitation
    SET removed_date = (now() AT TIME ZONE 'UTC')
    WHERE user_uuid = $1 AND survey_uuid = $2
    RETURNING uuid`,
    [userUuidToRemove, Survey.getUuid(Survey.getSurveyInfo(survey))]
  )
