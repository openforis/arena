import * as R from 'ramda'
import * as camelize from 'camelize'

import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as RecordValidation from '@core/record/recordValidation'

import * as Validation from '@core/validation/validation'

import { db } from '@server/db/db'
import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

// ============== READ

const query = surveyId =>
  `SELECT
    r.uuid,
    r.step,
    r.owner_uuid,

    node_validation.key AS node_uuid,
    node_validation.value::jsonb #- '{${Validation.keys.fields}, ${
    RecordValidation.keys.childrenCount
  }}' AS validation, --exclude childrenCountValidation

    h.node_def_uuid,
    h.keys_self,
    h.keys_hierarchy,

    -- children count validation
    validation_count.key AS validation_count_child_uuid,
    validation_count.value AS validation_count
  FROM
    ${getSurveyDBSchema(surveyId)}.record r,
    jsonb_each(r.validation #> '{${Validation.keys.fields}}' ) node_validation
  JOIN
    ${SchemaRdb.getName(surveyId)}._node_keys_hierarchy h
  ON node_validation.key::uuid = h.node_uuid
  
  LEFT OUTER JOIN
    jsonb_each(node_validation.value #> '{${Validation.keys.fields}, ${RecordValidation.keys.childrenCount}, ${
    Validation.keys.fields
  }}') validation_count
  ON true
  WHERE 
    r.cycle = $1
    AND NOT r.preview
  ORDER BY r.uuid, h.node_id
  LIMIT $2
  OFFSET $3`

export const fetchValidationReport = async (surveyId, cycle, offset = 0, limit = null, client = db) =>
  await client.map(
    query(surveyId),
    [cycle, limit, offset],
    R.pipe(
      R.toPairs,
      R.reduce((obj, [k, v]) => R.assoc(camelize(k), v, obj), {}),
    ),
  )

export const countValidationReports = async (surveyId, cycle, client = db) =>
  await client.one(`SELECT count(*) from(${query(surveyId)}) AS v`, [cycle, null, null])
