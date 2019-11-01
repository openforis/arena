import camelize from 'camelize'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as User from '@core/user/user'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as db from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'


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
export const fetch = async (surveyId, draft = false, activityTypes = null, offset = 0, limit = 30, client = db) =>
  await client.map(`
    WITH
      log AS
      (
        SELECT
          a.id,
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
      l.content || jsonb_build_object(
        'userName', u.name,
        'nodeDefParentUuid', node_def_parent.uuid,
        'nodeDefName', ${DbUtils.getPropColCombined(NodeDef.propKeys.name, draft, 'node_def.')},
        'nodeDefParentName', ${DbUtils.getPropColCombined(NodeDef.propKeys.name, draft, 'node_def_parent.')},
        'categoryName', ${DbUtils.getPropColCombined(Category.props.name, draft, 'category.')}
      ) as content
    FROM
      log AS l
    JOIN
      public."user" u
    ON
      u.uuid = l.user_uuid
    LEFT OUTER JOIN
      ${getSurveyDBSchema(surveyId)}.node_def
      on l.content ->> 'uuid' = node_def.uuid::text
    LEFT OUTER JOIN
      ${getSurveyDBSchema(surveyId)}.node_def node_def_parent
      on l.content ->> 'parentUuid' = node_def_parent.uuid::text
    LEFT OUTER JOIN
      ${getSurveyDBSchema(surveyId)}.category
      on l.content ->> 'uuid' = category.uuid::text
    WHERE
      l.rank = 1
    ORDER BY
      l.date_created DESC
    OFFSET $2
    LIMIT $3`,
    [activityTypes, offset, limit],
    camelize
  )
