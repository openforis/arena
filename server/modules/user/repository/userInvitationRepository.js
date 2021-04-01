import { db } from '@server/db/db'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as camelize from 'camelize'
import * as DbUtils from '@server/db/dbUtils'

export const tableName = 'user_invitation'

export const tableColumns = ['user_uuid', 'survey_uuid', 'invited_by', 'invited_date', 'removed_date']

export const insertUserInvitation = async ({ user, survey, userToInvite }, client = db) =>
  client.one(
    `INSERT INTO ${tableName} (user_uuid, survey_uuid, invited_by)
      VALUES ($1, $2, $3)
      RETURNING id`,
    [User.getUuid(userToInvite), Survey.getUuid(Survey.getSurveyInfo(survey)), User.getUuid(user)]
  )

export const updateRemovedDate = async ({ survey, userUuidToRemove }, client = db) =>
  client.one(
    `UPDATE ${tableName}
    SET removed_date = (now() AT TIME ZONE 'UTC')
    WHERE user_uuid = $1 AND survey_uuid = $2
    RETURNING id`,
    [userUuidToRemove, Survey.getUuid(Survey.getSurveyInfo(survey))]
  )

export const fetchUserInvitationsBySurveyId = async ({ survey }, client = db) =>
  client.map(
    `
    SELECT 
        *
    FROM user_invitation
    WHERE survey_uuid = $1
    `,
    [Survey.getUuid(Survey.getSurveyInfo(survey))],
    camelize
  )

export const insertManyBatch = async ({ survey, userInvitations }, client = db) =>
  userInvitations.length > 0 &&
  client.none(
    DbUtils.insertAllQueryBatch(
      'public',
      tableName,
      tableColumns,
      userInvitations.map((userInvitation) => ({
        user_uuid: userInvitation.userUuid,
        survey_uuid: Survey.getUuid(Survey.getSurveyInfo(survey)),
        invited_by: userInvitation.invitedBy,
        invited_date: userInvitation.invitedDate,
        removed_date: userInvitation.removedDate,
      }))
    )
  )
