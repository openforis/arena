import camelize from 'camelize'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as User from '@core/user/user'
import * as db from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import * as ActivityLog from '@common/activityLog/activityLog'

//===== CREATE
export const insert = async (user, surveyId, type, content, system, client) =>
  await client.none(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.activity_log (type, user_uuid, content, system)
    VALUES ($1, $2, $3::jsonb, $4)`,
    [type, User.getUuid(user), content, system])

export const insertMany = async (user, surveyId, activities, client) =>
  await client.batch([
    activities.map(activity =>
      insert(user, surveyId, ActivityLog.getType(activity), ActivityLog.getContent(activity), ActivityLog.isSystem(activity), client)
    )
  ])

//===== READ
export const fetch = async (surveyId, activityTypes, offset = 0, client = db) =>
  await client.map(`
    WITH
      log AS
      (
        SELECT
          a.type,
          ${DbUtils.selectDate('a.date_created', 'date_created')},
          a.user_uuid,
          a.content,
          RANK() OVER (PARTITION BY a.user_uuid, a.type, a.content->'uuid' ORDER BY a.date_created DESC) -- use always uuid in content
          AS rank
        FROM
          ${getSurveyDBSchema(surveyId)}.activity_log a
        WHERE
          system = false
        ${activityTypes ? 'AND a.type IN ($1:csv)' : ''}
    
      )
    SELECT
      l.*,
      u.name,
      n.uuid as node_def_parent_uuid
    FROM
      log AS l
    JOIN
      public."user" u
    ON
      u.uuid = l.user_uuid
    LEFT OUTER JOIN
      ${getSurveyDBSchema(surveyId)}.node_def n
      on l.content ->> 'parentUuid'  = n.uuid::text
    WHERE
      l.rank = 1
    ORDER BY
      l.date_created DESC
    OFFSET $2
    LIMIT 30`,
    [activityTypes, offset],
    camelize
  )
