import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as User from '@core/user/user'
import * as db from '@server/db/db'

import * as Activity from '../activity'

export const insert = async (user, surveyId, activity, client) =>
  client.none(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.activity_log (type, user_uuid, content, system)
    VALUES ($1, $2, $3::jsonb, $4)`,
    [Activity.getType(activity), User.getUuid(user), Activity.getContent(activity), Activity.isSystem(activity)])

export const insertMany = async (user, surveyId, activities, client) =>
  await client.batch([
    activities.map(activity => insert(user, surveyId, activity, client))
  ])

export const fetch = async (surveyId, activityTypes, offset = 0, client = db) =>
  client.any(`
    WITH
      log AS
      (
        SELECT
          a.type,
          a.date_created,
          a.user_uuid,
          a.params,
          RANK() OVER (PARTITION BY a.user_uuid, a.type, a.params->'uuid' ORDER BY a.date_created DESC) -- use always uuid in params
          AS rank
        FROM
          ${getSurveyDBSchema(surveyId)}.activity_log a
        WHERE
          system = false
        ${activityTypes ? 'AND a.type IN ($1)' : ''}
    
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
      on l.params ->> 'parentUuid'  = n.uuid::text
    WHERE
      l.rank = 1
    ORDER BY
      l.date_created DESC
    OFFSET $2
    LIMIT 30`,
    [activityTypes, offset]
  )

export const fetchAll = async (surveyId, client = db) =>
  await client.any(`SELECT * FROM ${getSurveyDBSchema(surveyId)}.activity_log`)
