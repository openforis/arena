import camelize from 'camelize'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as Node from '@core/record/node'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

//===== CREATE
export const insert = async (user, surveyId, type, content, system, client) =>
  await client.none(`
    INSERT INTO ${getSurveyDBSchema(surveyId)}.activity_log (type, user_uuid, content, system)
    VALUES ($1, $2, $3::jsonb, $4)`,
    [type, User.getUuid(user), content || {}, system]
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
      log_days AS 
      (
        -- Get rows up to offset+limit.
        -- From this we obtain the earliest date to we need to consider in the later query.
        select date
        from ${schema}.activity_log_user_aggregate_keys
        ${activityTypes ? ' WHERE type in ($2)' : ''}
        LIMIT $3::int + $4::int -- LIMIT + OFFSET
      ),
      log_days_all AS (
        -- With the date, refine the query to include ALL rows
        -- from activity_log_user_aggregate up to and including that date.
        --
        -- Then sort the result with the real timestamp to obtain the correct
        -- ordering of log entries from the view.
        SELECT *
        FROM ${schema}.activity_log_user_aggregate
        WHERE date_created >= (select min(log_days.date) from log_days)
        ${activityTypes ? ' AND type in ($2)' : ''}
      ),
      log_limited AS (
        -- With the correct list of rows, sort them in the right order
        -- and return the result respecting the given LIMIT and OFFSET parameters.
        SELECT
          id,
          content,
          type,
          user_uuid, 
          ${DbUtils.selectDate('date_created')},
          content_uuid
        FROM log_days_all
        ORDER BY date_created DESC, id DESC -- id is a tie-breaker
        OFFSET $3
        LIMIT $4
      ),
      log_node_hierarchy AS
      (
        --nodeCreate/nodeValueUpdate: get hierarchy from content.meta.h
        SELECT 
          l.id, 
          jsonb_array_elements_text(l.content #> '{${Node.keys.meta},${Node.metaKeys.hierarchy}}')::uuid AS ancestor_node_uuid
        FROM log_limited l 
      ),      
      log_parent_paths AS
      (
        SELECT
          log_node_hierarchy.id,
          json_agg(json_build_object(
            'nodeDefUuid', node_h.node_def_uuid, 
            'nodeUuid', log_node_hierarchy.ancestor_node_uuid
          )) AS parent_path
        FROM 
          log_node_hierarchy
        LEFT OUTER JOIN 
          ${schema}.node node_h 
          ON node_h.uuid = log_node_hierarchy.ancestor_node_uuid  
        GROUP BY
          log_node_hierarchy.id
      )

    SELECT
      l.*,
      u.name AS user_name,
      r.uuid AS record_uuid,
      
      -- node activities keys
      
      n.node_def_uuid AS node_def_uuid,
      coalesce(log_parent_paths.parent_path, '[]'::json) parent_path,
      
      -- user activities keys
      
      user_target.name AS target_user_name,
      user_target.email AS target_user_email,
      agu.user_uuid AS target_user_uuid, -- null if user has been removed from survey
      
      -- analysis activities keys
      
      processing_chain.props->'${ProcessingChain.keysProps.labels}' AS processing_chain_labels,
      processing_step.index AS processing_step_index
      
    FROM
      log_limited AS l
    JOIN
      public."user" u
    ON
      u.uuid = l.user_uuid
    LEFT OUTER JOIN 
      ${schema}.record r
    ON
      r.uuid = l.content_uuid

    -- start of node activities part
    LEFT OUTER JOIN 
      ${schema}.node n 
    ON 
      n.uuid = l.content_uuid
    LEFT OUTER JOIN 
      log_parent_paths
    ON 
      l.id = log_parent_paths.id
    -- end of node activities part

    -- start of user activities part
    
    -- join with user table to get user name and email
    LEFT OUTER JOIN 
      public.user user_target
    ON 
      user_target.uuid = l.content_uuid
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
      processing_chain.uuid IN (l.content_uuid, (l.content->>'${ProcessingStep.keys.processingChainUuid}')::uuid)
    LEFT OUTER JOIN 
      ${schema}.processing_step
    ON 
      processing_step.uuid = l.content_uuid
    -- end of analysis activities part

    ORDER BY
      l.date_created DESC`,
    [surveyUuid, activityTypes, offset, limit],
    camelize
  )
}
