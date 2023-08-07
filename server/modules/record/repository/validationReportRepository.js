import { Transform } from 'stream'

import * as A from '@core/arena'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

const { prefixValidationFieldChildrenCount: prefixChildrenCount } = RecordValidation

// ============== READ

const query = ({ surveyId, recordUuid }) => {
  const surveySchema = getSurveyDBSchema(surveyId)
  const uuidLength = 36

  return `WITH node_validation AS (
    SELECT 
      r.uuid AS record_uuid,
      -- node_uuid
      -- if the length of the key is ${uuidLength}, then it's a uuid
      -- otherwise the key of the field validation starts with '${prefixChildrenCount}' followed by the child def uuid
      (
        CASE WHEN LENGTH(nv.key) = ${uuidLength}
        THEN nv.key
        ELSE SUBSTRING(nv.key, ${prefixChildrenCount.length + 1}, ${uuidLength})
        END
      )::uuid AS node_uuid,
      -- validation_count_child_def_uuid
      (
        CASE WHEN LENGTH(nv.key) > ${uuidLength}
        THEN SUBSTRING(nv.key, ${prefixChildrenCount.length + uuidLength + 2}, ${uuidLength})
        ELSE NULL
        END
      )::uuid AS validation_count_child_def_uuid,
      -- node validation object
      nv.value::jsonb AS validation
    FROM
      ${surveySchema}.record r,
      jsonb_each(r.validation #> '{${Validation.keys.fields}}' ) nv    
  )
    
  SELECT
      r.cycle AS record_cycle,
      r.owner_uuid AS record_owner_uuid,
      r.step AS record_step,
      r.uuid AS record_uuid,
      r.date_created as record_date_created,
      u.name as record_owner_name,
      n.id AS node_id,
      n.uuid AS node_uuid,
      n.node_def_uuid,
      nv.validation_count_child_def_uuid,
      nv.validation,
      
      -- TODO: check why subquery is faster than outer join when joining _node_keys_hierarchy view
      (SELECT h.keys_self 
        FROM ${SchemaRdb.getName(surveyId)}._node_keys_hierarchy h
        WHERE h.node_uuid = n.uuid
      ),
      (SELECT h.keys_hierarchy 
        FROM ${SchemaRdb.getName(surveyId)}._node_keys_hierarchy h
        WHERE h.node_uuid = n.uuid
      ),
      -- GET LAST MODIFIED NODE DATE
      (
        SELECT MAX(n.date_modified)
        FROM ${getSurveyDBSchema(surveyId)}.node n
        WHERE n.record_uuid = r.uuid
      ) AS record_date_modified
    FROM
      ${surveySchema}.record r
      JOIN "user" u
        ON (r.owner_uuid = u.uuid)
      JOIN 
        node_validation nv
        ON (r.uuid = nv.record_uuid)
      JOIN
        ${surveySchema}.node n
        ON n.uuid = nv.node_uuid
    WHERE 
      r.cycle = $/cycle/
      AND NOT r.preview
      -- exclude analysis variables
      AND n.node_def_uuid NOT IN (SELECT uuid FROM ${surveySchema}.node_def WHERE analysis IS TRUE)
      ${recordUuid ? 'AND r.uuid = $/recordUuid/' : ''}
    ORDER BY r.date_created, n.id`
}

const _rowToItem = A.camelizePartial({ limitToLevel: 1 })

export const fetchValidationReport = async (
  { surveyId, cycle, offset = 0, limit = null, recordUuid = null },
  client = db
) =>
  client.map(
    `${query({ surveyId, recordUuid })}
      LIMIT $/limit/
      OFFSET $/offset/`,
    { cycle, limit, offset, recordUuid },
    _rowToItem
  )

export const countValidationReportItems = async ({ surveyId, cycle, recordUuid = null }, client = db) =>
  client.one(`SELECT COUNT(*) FROM(${query({ surveyId, recordUuid })}) AS v`, { cycle, recordUuid })

export const exportValidationReportToStream = (
  { streamTransformer, surveyId, cycle, recordUuid = null },
  client = db
) => {
  const queryFormatted = DbUtils.formatQuery(query({ surveyId, recordUuid }), { cycle, recordUuid })

  const rowsToItemsTransformer = new Transform({
    objectMode: true,
    transform(row, _encoding, callback) {
      const item = _rowToItem(row)
      callback(null, item)
    },
  })

  return client.stream(new DbUtils.QueryStream(queryFormatted), (dbStream) => {
    dbStream.pipe(rowsToItemsTransformer).pipe(streamTransformer)
  })
}
