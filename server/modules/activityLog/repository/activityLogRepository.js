import camelize from 'camelize'

import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import * as ActivityLog from '@common/activityLog/activityLog'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'
import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as NodeKeysHierarchyView from '@server/modules/surveyRdb/schemaRdb/nodeKeysHierarchyView'

// ===== CREATE
export const insert = async (user, surveyId, type, content, system, client) =>
  client.none(
    `
    INSERT INTO ${getSurveyDBSchema(surveyId)}.activity_log (type, user_uuid, content, system)
    VALUES ($1, $2, $3::jsonb, $4)`,
    [type, User.getUuid(user), content || {}, system]
  )

export const insertMany = async (user, surveyId, activities, client) =>
  client.batch(
    activities.map((activity) =>
      insert(
        user,
        surveyId,
        ActivityLog.getType(activity),
        ActivityLog.getContent(activity),
        ActivityLog.isSystem(activity),
        client
      )
    )
  )

// ===== READ
export const fetch = async (
  surveyInfo,
  activityTypes = null,
  idGreaterThan = null,
  idLessThan = null,
  limit = 30,
  client = db
) => {
  const surveyUuid = Survey.getUuid(surveyInfo)
  const surveyId = Survey.getIdSurveyInfo(surveyInfo)
  const published = Survey.isPublished(surveyInfo)
  const schema = getSurveyDBSchema(surveyId)

  const limitedById = idGreaterThan || idLessThan
  const conditionLimitedById = ` id ${idGreaterThan ? `> ${idGreaterThan}` : `< ${idLessThan}`}`

  return client.map(
    `
  WITH
      log_days AS 
      (
        -- Get rows up to offset+limit.
        -- From this we obtain the earliest date to we need to consider in the later query.
        select date
        from ${schema}.activity_log_user_aggregate_keys
        WHERE true
        ${activityTypes ? ' AND type in ($2:csv)' : ''}
        ${limitedById ? ` AND ${conditionLimitedById}` : ''}
        LIMIT $3::int + 100 -- add 100 rows to get a better estimation of date
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
        ${activityTypes ? ' AND type in ($2:csv)' : ''}
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
        ${limitedById ? `WHERE ${conditionLimitedById}` : ''}
        ORDER BY date_created DESC, id DESC -- id is a tie-breaker
        LIMIT $3
      )

    SELECT
      l.*,
      u.name AS user_name,
      r.uuid AS record_uuid,      
      to_json(t) AS taxonomy,
      to_json(c) AS category,
      
      -- node activities keys
    ${
      published
        ? `
      n_h.${NodeKeysHierarchyView.columns.nodeDefUuid},
      n_h.${NodeKeysHierarchyView.columns.keysHierarchy},
      `
        : ''
    }
      -- user activities keys
      user_target.name AS target_user_name,
      user_target.email AS target_user_email,
      agu.user_uuid AS target_user_uuid, -- null if user has been removed from survey
      
      -- analysis activities keys
      processing_chain.props->'${ProcessingChain.keysProps.labels}' AS processing_chain_labels,
      processing_step.index AS processing_step_index,
      processing_step_calculation.index AS processing_step_calculation_index
      
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
      
    LEFT OUTER JOIN
      ${schema}.taxonomy t
    ON
      t.uuid = l.content_uuid   
      
     LEFT OUTER JOIN
      ${schema}.category c
    ON
      c.uuid = l.content_uuid OR (l.content::json->>'categoryUuid' IS NOT NULL AND c.uuid = (l.content::json->>'categoryUuid')::uuid)

    -- start of node activities part
    ${
      published
        ? `
    LEFT OUTER JOIN
      ${NodeKeysHierarchyView.getNameWithSchema(surveyId)} n_h
    ON
      l.content_uuid = n_h.${NodeKeysHierarchyView.columns.nodeUuid}
    `
        : ''
    }
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
      processing_step.uuid IN (l.content_uuid, (l.content->>'${
        ProcessingStepCalculation.keys.processingStepUuid
      }')::uuid)
    LEFT OUTER JOIN 
      ${schema}.processing_step_calculation
    ON 
      processing_step_calculation.uuid = l.content_uuid
    -- end of analysis activities part

    ORDER BY
      l.id DESC`,
    [surveyUuid, activityTypes, limit],
    camelize
  )
}
