import * as R from 'ramda'
import * as camelize from 'camelize'

import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as RecordValidation from '@core/record/recordValidation'

import * as Validation from '@core/validation/validation'

import { db } from '@server/db/db'
import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

const { prefixValidationFieldChildrenCount: prefixChildrenCount } = RecordValidation

// ============== READ

const query = ({ surveyId, recordUuid }) =>
  `SELECT
      r.uuid as record_uuid,
      r.step as record_step,
      r.owner_uuid as record_owner_uuid,

      h.node_uuid,
      
      -- validation_count_child_def_uuid
      CASE WHEN LENGTH(node_validation.key) > 36 
        THEN SUBSTRING(node_validation.key, ${prefixChildrenCount.length + 38}, 36)
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
    ON (CASE 
      WHEN LENGTH(node_validation.key) = 36 
      THEN node_validation.key 
      -- count validation: the key of the field validation starts with '${prefixChildrenCount}' followed by the child def uuid
      ELSE SUBSTRING(node_validation.key, ${prefixChildrenCount.length + 1}, 36)
      END
    ) = h.node_uuid::text
    WHERE 
      h.record_uuid = r.uuid 
      AND r.cycle = $/cycle/
      AND NOT r.preview
      -- exclude analysis variables
      AND h.node_def_uuid NOT IN (SELECT uuid FROM ${getSurveyDBSchema(surveyId)}.node_def WHERE analysis IS TRUE)
      ${recordUuid ? 'AND r.uuid = $/recordUuid/' : ''}
    ORDER BY r.date_created, h.node_id`

export const fetchValidationReport = async (
  { surveyId, cycle, offset = 0, limit = null, recordUuid = null },
  client = db
) =>
  client.map(
    `${query({ surveyId, recordUuid })}
      LIMIT $/limit/
      OFFSET $/offset/`,
    { cycle, limit, offset, recordUuid },

    R.pipe(
      R.toPairs,
      R.reduce((obj, [k, v]) => R.assoc(camelize(k), v, obj), {})
    )
  )

export const countValidationReportItems = async ({ surveyId, cycle, recordUuid = null }, client = db) =>
  client.one(`SELECT COUNT(*) FROM(${query({ surveyId, recordUuid })}) AS v`, { cycle, recordUuid })
