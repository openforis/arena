import camelize from 'camelize'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as Node from '@core/record/node'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

import * as db from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

//===== CREATE
export const insert = async (user, surveyId, type, content, system, client) =>
  await client.none(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.activity_log (type, user_uuid, content, system)
    VALUES ($1, $2, $3::jsonb, $4)`,
    [type, User.getUuid(user), content, system]
  )

export const insertMany = async (user, surveyId, activities, client) =>
  await client.batch([
    activities.map(activity =>
      insert(user, surveyId, ActivityLog.getType(activity), ActivityLog.getContent(activity), ActivityLog.isSystem(activity), client)
    )
  ])

//===== READ
export const fetch = async (surveyInfo, activityTypes = null, offset = 0, limit = 30, client = db) => {
  const surveyUuid = Survey.getUuid(surveyInfo)
  const surveyId = Survey.getIdSurveyInfo(surveyInfo)
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
      node_hierarchy AS
      (
        --nodeCreate/nodeValueUpdate: get hierarchy from content.meta.h
        SELECT l.id, jsonb_array_elements_text(l.content #> '{${Node.keys.meta},${Node.metaKeys.hierarchy}}') AS node_uuid
        FROM ${schema}.activity_log l 
      )

    SELECT
      l.*,
      u.name AS user_name,
      r.uuid AS record_uuid,
      
      -- node activities keys
      
      n.node_def_uuid AS node_def_uuid,
      json_agg(json_build_object(
        'nodeDefUuid', node_h.node_def_uuid, 
        'nodeUuid', h.node_uuid
      )) AS parent_path,
      
      -- user activities keys
      
      user_target.name AS target_user_name,
      user_target.email AS target_user_email,
      agu.user_uuid AS target_user_uuid, -- null if user has been removed from survey
      
      -- analysis activities keys
      
      processing_chain.props->'${ProcessingChain.keysProps.labels}' AS processing_chain_labels,
      processing_step.index AS processing_step_index
      
    FROM
      log AS l
    JOIN
      public."user" u
    ON
      u.uuid = l.user_uuid
    LEFT OUTER JOIN 
      ${schema}.record r
    ON
      l.content->>'uuid' = r.uuid::text

    -- start of node activities part
    LEFT OUTER JOIN 
      ${schema}.node n 
    ON 
      l.content->>'uuid' = n.uuid::text
    LEFT OUTER JOIN 
      node_hierarchy h
    ON 
      h.id = l.id
    LEFT OUTER JOIN 
      ${schema}.node node_h 
    ON 
      node_h.uuid::text = h.node_uuid
    -- end of node activities part

    -- start of user activities part
    
    -- join with user table to get user name and email
    LEFT OUTER JOIN 
      public.user user_target
    ON 
      l.content->>'uuid' = user_target.uuid::text
    -- join with auth group tables to check if the target user has been removed 
    LEFT OUTER JOIN
      public.auth_group_user agu
    ON
      agu.user_uuid = user_target.uuid 
    LEFT OUTER JOIN
      public.auth_group ag
    ON 
      ag.uuid = agu.group_uuid AND ag.survey_uuid = $1
    
    -- end of user activities part

    -- start of analysis activities part
    LEFT OUTER JOIN 
      ${schema}.processing_chain
    ON 
      processing_chain.uuid::text IN (l.content->>'uuid', l.content->>'${ProcessingStep.keys.processingChainUuid}')
    LEFT OUTER JOIN 
      ${schema}.processing_step
    ON 
      processing_step.uuid::text = l.content->>'uuid'
    -- end of analysis activities part
    
    WHERE
      l.rank = 1
    GROUP BY 
      l.id, l.type, l.date_created, l.user_uuid, l.content, l.rank, u.name, r.uuid, n.record_uuid, n.node_def_uuid, 
      user_target.name, user_target.email, agu.user_uuid,
      processing_chain.props, processing_step.index
    ORDER BY
      l.date_created DESC
    OFFSET $3
    LIMIT $4`,
    [surveyUuid, activityTypes, offset, limit],
    camelize
  )
}
