import { Transform } from 'stream'

import * as A from '@core/arena'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'
import * as Expression from '@core/expressionParser/expression'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

import { DbOrder } from '@server/db'
import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

const { prefixValidationFieldChildrenCount: prefixChildrenCount } = RecordValidation

const sortFieldBySortBy = {
  dateCreated: 'record_date_created',
  dateModified: 'record_date_modified',
  message: 'validation',
  owner: 'record_owner_name',
  path: 'keys_hierarchy',
}

const getOrderByClause = ({ sortBy, sortOrder }) => {
  const sortField = sortFieldBySortBy[sortBy] ?? sortFieldBySortBy.dateCreated
  const sortOrderNormalized = DbOrder.normalize(sortOrder, DbOrder.desc).toUpperCase()
  return `${sortField} ${sortOrderNormalized}, node_id ASC`
}

// ============== READ

const query = ({ surveyId, recordUuid, filterBySurveyAttrs = null, sortBy, sortOrder }) => {
  const surveySchema = getSurveyDBSchema(surveyId)
  const surveyRdbSchema = SchemaRdb.getName(surveyId)
  const childrenCountPrefixLength = prefixChildrenCount.length
  const filter = filterBySurveyAttrs?.filter
  const rootDataViewName = filterBySurveyAttrs?.rootDataViewName
  const attributeDefUuids = filterBySurveyAttrs?.attributeDefUuids
  const messageTypeKeys = filterBySurveyAttrs?.messageTypeKeys
  const { clause: filterClause = null, params: filterParams = {} } = filter ? Expression.toSql(filter) : {}

  const filterBySurveyAttrsClause =
    filterClause && rootDataViewName
      ? `
      AND EXISTS (
        SELECT 1
        FROM ${surveyRdbSchema}.$/rootDataViewName:name/ root_data
        WHERE root_data.record_uuid = r.uuid
          AND root_data.record_cycle = r.cycle
          AND ${filterClause}
      )`
      : ''

  let filterByAttributeDefsClause
  if (Array.isArray(attributeDefUuids) && attributeDefUuids.length === 0) {
    filterByAttributeDefsClause = 'AND 1 = 0'
  } else if (attributeDefUuids?.length > 0) {
    filterByAttributeDefsClause = `AND n.node_def_id IN (SELECT id FROM ${surveySchema}.node_def WHERE uuid IN ($/attributeDefUuids:csv/))`
  } else {
    filterByAttributeDefsClause = ''
  }

  let filterByMessageTypesClause
  if (Array.isArray(messageTypeKeys) && messageTypeKeys.length === 0) {
    filterByMessageTypesClause = 'AND 1 = 0'
  } else if (messageTypeKeys?.length > 0) {
    filterByMessageTypesClause = `AND jsonb_path_query_array(nv.validation, '$.**.key') ?| ARRAY[$/messageTypeKeys:csv/]::text[]`
  } else {
    filterByMessageTypesClause = ''
  }

  const orderByClause = getOrderByClause({ sortBy, sortOrder })

  const text = `WITH node_validation AS (
    SELECT
      r.uuid AS record_uuid,
      -- node_i_id
      -- if the key does not start with '${prefixChildrenCount}', it's a plain node internal id;
      -- otherwise the key is '${prefixChildrenCount}' followed by the parent node internal id, an
      -- underscore, and the child def uuid - the parent's internal id is what the report attaches
      -- the children-count validation message to.
      (
        CASE WHEN LEFT(nv.key, ${childrenCountPrefixLength}) = '${prefixChildrenCount}'
        THEN split_part(nv.key, '_', 2)
        ELSE nv.key
        END
      )::int AS node_i_id,
      -- validation_count_child_def_uuid
      (
        CASE WHEN LEFT(nv.key, ${childrenCountPrefixLength}) = '${prefixChildrenCount}'
        THEN split_part(nv.key, '_', 3)
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
      r.date_modified as record_date_modified,
      u.name as record_owner_name,
      n.id AS node_id,
      nd.uuid AS node_def_uuid,
      nv.validation_count_child_def_uuid,
      nv.validation,

      -- TODO: check why subquery is faster than outer join when joining _node_keys_hierarchy view
      (SELECT h.keys_self
        FROM ${surveyRdbSchema}._node_keys_hierarchy h
        WHERE h.node_i_id = n.i_id AND h.record_uuid = n.record_uuid
      ),
      (SELECT h.keys_hierarchy
        FROM ${surveyRdbSchema}._node_keys_hierarchy h
        WHERE h.node_i_id = n.i_id AND h.record_uuid = n.record_uuid
      )
    FROM
      ${surveySchema}.record r
      JOIN "user" u
        ON (r.owner_uuid = u.uuid)
      JOIN
        node_validation nv
        ON (r.uuid = nv.record_uuid)
      JOIN
        ${surveySchema}.node n
        ON n.i_id = nv.node_i_id AND n.record_uuid = nv.record_uuid
      JOIN
        ${surveySchema}.node_def nd
        ON nd.id = n.node_def_id
    WHERE
      r.cycle = $/cycle/
      AND NOT r.preview
      -- exclude analysis variables
      AND NOT nd.analysis
      ${recordUuid ? 'AND r.uuid = $/recordUuid/' : ''}
      ${filterBySurveyAttrsClause}
      ${filterByAttributeDefsClause}
      ${filterByMessageTypesClause}
    ORDER BY ${orderByClause}`

  return {
    text,
    params: {
      ...filterParams,
      ...(attributeDefUuids?.length > 0 ? { attributeDefUuids } : {}),
      ...(messageTypeKeys?.length > 0 ? { messageTypeKeys } : {}),
      ...(rootDataViewName ? { rootDataViewName } : {}),
    },
  }
}

const _rowToItem = A.camelizePartial({ limitToLevel: 1, sideEffect: true })

export const fetchValidationReport = async (
  { surveyId, cycle, offset = 0, limit = null, recordUuid = null, filterBySurveyAttrs = null, sortBy, sortOrder },
  client = db
) => {
  const { text, params } = query({ surveyId, recordUuid, filterBySurveyAttrs, sortBy, sortOrder })
  return client.map(
    `${text}
      LIMIT $/limit/
      OFFSET $/offset/`,
    { cycle, limit, offset, recordUuid, ...params },
    _rowToItem
  )
}

export const countValidationReportItems = async (
  { surveyId, cycle, recordUuid = null, filterBySurveyAttrs = null },
  client = db
) => {
  const { text, params } = query({ surveyId, recordUuid, filterBySurveyAttrs })
  return client.one(`SELECT COUNT(*) FROM(${text}) AS v`, { cycle, recordUuid, ...params }, (row) => Number(row.count))
}

export const getValidationReportAsStream = (
  { surveyId, cycle, recordUuid = null, filterBySurveyAttrs = null, processor },
  client = db
) => {
  const { text, params } = query({ surveyId, recordUuid, filterBySurveyAttrs })
  const queryFormatted = DbUtils.formatQuery(text, { cycle, recordUuid, ...params })

  const rowsToItemsTransformer = new Transform({
    objectMode: true,
    transform(row, _encoding, callback) {
      const item = _rowToItem(row)
      callback(null, item)
    },
  })
  return DbUtils.fetchQueryAsStream({ query: queryFormatted, client, transformer: rowsToItemsTransformer, processor })
}
