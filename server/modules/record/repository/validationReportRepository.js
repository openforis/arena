import * as camelize from 'camelize'

import { db } from '@server/db/db'

import { getSurveyDBSchema } from '../../survey/repository/surveySchemaRepositoryUtils'
import * as SchemaRdb from '../../../../common/surveyRdb/schemaRdb'

// ============== READ

const query = (surveyId, offset = 0, limit = null) =>
  `SELECT
    r.uuid,
    r.step,
    r.owner_uuid,

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
  WHERE 
    r.cycle = $1
    AND NOT r.preview
  ORDER BY r.uuid, h.node_id
  LIMIT ${limit || 'ALL'}
  OFFSET ${offset}`

export const fetchValidationReport = async (surveyId, cycle, offset = 0, limit = null, client = db) =>
  await client.map(query(surveyId, offset, limit), [cycle], res =>
    Object.entries(res).reduce((obj, [k, v]) => { obj[camelize(k)] = v; return obj }, {}))

export const countValidationReports = async (surveyId, cycle, client = db) =>
  await client.one(`SELECT count(*) from(${query(surveyId, '0')}) as v`, [cycle])