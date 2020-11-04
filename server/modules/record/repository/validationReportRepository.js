import * as R from 'ramda'
import * as camelize from 'camelize'

import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as RecordValidation from '@core/record/recordValidation'

import * as Validation from '@core/validation/validation'

import { db } from '@server/db/db'
import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

// ============== READ

const query = (surveyId) =>
  `SELECT
      r.uuid as record_uuid,
      r.step as record_step,
      r.owner_uuid as record_owner_uuid,

      h.node_uuid,
      
      -- validation_count_child_def_uuid
      CASE WHEN LENGTH(node_validation.key) > 36 
        THEN SUBSTRING(node_validation.key, ${RecordValidation.prefixValidationFieldChildrenCount.length + 38}, 36)
        ELSE NULL
        END 
        AS validation_count_child_def_uuid,
      
      node_validation.value::jsonb AS validation,

      h.node_def_uuid,
      h.keys_self,
      h.keys_hierarchy
    FROM
      ${getSurveyDBSchema(surveyId)}.record r,
      jsonb_each(r.validation #> '{${Validation.keys.fields}}' ) node_validation
    JOIN
      ${SchemaRdb.getName(surveyId)}._node_keys_hierarchy h
    ON LENGTH(node_validation.key) = 36 AND node_validation.key = h.node_uuid::text
    -- count validation
    OR LENGTH(node_validation.key) > 36 AND SUBSTRING(node_validation.key, ${
      RecordValidation.prefixValidationFieldChildrenCount.length + 1
    }, 36) = h.node_uuid::text
    WHERE 
      h.record_uuid = r.uuid 
      AND r.cycle = $/cycle/
      AND NOT r.preview
    ORDER BY r.uuid, h.node_id`

export const fetchValidationReport = async (surveyId, cycle, offset = 0, limit = null, client = db) =>
  client.map(
    `${query(surveyId)}
      LIMIT $/limit/
      OFFSET $/offset/`,
    { cycle, limit, offset },

    R.pipe(
      R.toPairs,
      R.reduce((obj, [k, v]) => R.assoc(camelize(k), v, obj), {})
    )
  )

export const countValidationReports = async (surveyId, cycle, client = db) =>
  client.one(`SELECT count(*) from(${query(surveyId)}) AS v`, { cycle })
