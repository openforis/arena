import camelize from 'camelize'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as User from '@core/user/user'

import * as ActivityLog from '@common/activityLog/activityLog'
import * as Node from '@core/record/node'

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
export const fetch = async (surveyId, activityTypes = null, offset = 0, limit = 30, client = db) => {
  const schema = getSurveyDBSchema(surveyId)
  return await client.map(`
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
          ${schema}.activity_log a
        WHERE
          system = false
        ${activityTypes ? 'AND a.type IN ($1:csv)' : ''}
    
      ),
      node_hierarchy AS (
        --nodeCreate/nodeValueUpdate: get hierarchy from content.meta.h
        SELECT l.id, jsonb_array_elements_text(l.content #> '{${Node.keys.meta},${Node.metaKeys.hierarchy}}') AS node_uuid
        FROM ${schema}.activity_log l 
      )

    SELECT
      l.*,
      u.name AS user_name,
      r.uuid AS record_uuid,
      n.node_def_uuid AS node_def_uuid,
      json_agg(json_build_object(
        'nodeDefUuid', node_h.node_def_uuid, 
        'nodeUuid', h.node_uuid
      )) AS parent_path
    FROM
      log AS l
    JOIN
      public."user" u
    ON
      u.uuid = l.user_uuid
    LEFT OUTER JOIN 
      ${schema}.record r
      ON l.content->>'uuid' = r.uuid::text
    LEFT OUTER JOIN 
      ${schema}.node n 
      ON l.content->>'uuid' = n.uuid::text
    LEFT OUTER JOIN 
      node_hierarchy h
      ON h.id = l.id
    LEFT OUTER JOIN 
      ${schema}.node node_h 
      ON node_h.uuid::text = h.node_uuid
    WHERE
      l.rank = 1
    GROUP BY 
      l.id, l.type, l.date_created, l.user_uuid, l.content, l.rank, u.name, r.uuid, n.record_uuid, n.node_def_uuid
    ORDER BY
      l.date_created DESC
    OFFSET $2
    LIMIT $3`,
    [activityTypes, offset, limit],
    camelize
  )
}
