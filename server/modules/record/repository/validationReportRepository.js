// import * as R from 'ramda'
// import * as camelize from 'camelize'

import { db } from '@server/db/db'

import { getSurveyDBSchema } from '../../survey/repository/surveySchemaRepositoryUtils'
import * as SchemaRdb from '../../../../common/surveyRdb/schemaRdb'

// ============== READ

const query = (surveyId, offset = 0, limit = null) =>
  `SELECT
    k.key AS node_uuid,
    k.value AS validation,
    h.node_def_uuid,
    h.keys_self,
    h.keys_hierarchy
  FROM
    ${getSurveyDBSchema(surveyId)}.record r,
    jsonb_each(r.validation #> '{"fields"}' ) k
  JOIN
    ${SchemaRdb.getName(surveyId)}._node_keys_hierarchy h
  ON k.key::uuid = h.node_uuid
  ORDER BY r.uuid, h.node_id
  LIMIT ${limit || 'ALL'}
  OFFSET ${offset}`

export const fetchValidationReport = async (surveyId, offset, limit, client = db) =>
  await client.any(query(surveyId, offset, limit))

export const countValidationReports = async (surveyId, client = db) =>
  await client.one(`SELECT count(*) from(${query(surveyId)}) as v`)