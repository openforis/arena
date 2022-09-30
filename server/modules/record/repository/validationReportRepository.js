import { Transform } from 'stream'

import * as A from '@core/arena'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

import * as NodeKeysRepository from './nodeKeysRepository'

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
      n.id AS node_id,
      n.uuid AS node_uuid,
      n.node_def_uuid,
      nv.validation_count_child_def_uuid,
      nv.validation
    FROM
      ${surveySchema}.record r
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

const _transformRowsToItems = async ({ surveyId, rows }, client = db) => {
  const items = rows.map(A.camelizePartial({ limitToLevel: 1 }))
  const nodeUuids = items.map((item) => item.nodeUuid)
  const nodesKeys = await NodeKeysRepository.fetchNodesHierarchyKeys({ surveyId, nodeUuids }, client)

  return items.map((item) => {
    const nodeKeys = nodesKeys.find((nodeKeys) => nodeKeys.nodeUuid === item.nodeUuid) || {}
    return { ...item, ...nodeKeys }
  })
}

export const fetchValidationReport = async (
  { surveyId, cycle, offset = 0, limit = null, recordUuid = null },
  client = db
) => {
  const rows = await client.manyOrNone(
    `${query({ surveyId, recordUuid })}
      LIMIT $/limit/
      OFFSET $/offset/`,
    { cycle, limit, offset, recordUuid }
  )
  if (A.isEmpty(rows)) {
    return []
  }
  return await _transformRowsToItems({ surveyId, rows }, client)
}

export const countValidationReportItems = async ({ surveyId, cycle, recordUuid = null }, client = db) =>
  client.one(`SELECT COUNT(*) FROM(${query({ surveyId, recordUuid })}) AS v`, { cycle, recordUuid })

export const exportValidationReportToStream = (
  { streamTransformer, surveyId, cycle, recordUuid = null },
  client = db
) =>
  client.tx(async (tx) => {
    const queryFormatted = DbUtils.formatQuery(query({ surveyId, recordUuid }), { cycle, recordUuid })

    const rowsToItemsTransformer = new Transform({
      objectMode: true,
      transform(row, _encoding, callback) {
        _transformRowsToItems({ surveyId, rows: [row] }, tx)
          .then((transformedItems) => {
            const transformedItem = transformedItems[0]
            callback(null, transformedItem)
          })
          .catch((error) => callback(error))
      },
    })

    return tx.stream(new DbUtils.QueryStream(queryFormatted), (dbStream) => {
      dbStream.pipe(rowsToItemsTransformer).pipe(streamTransformer)
    })
  })
