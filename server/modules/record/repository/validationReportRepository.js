import { Transform } from 'node:stream'

import * as A from '@core/arena'
import * as RecordValidation from '@core/record/recordValidation'
import * as Validation from '@core/validation/validation'
import * as Expression from '@core/expressionParser/expression'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

import { DbOrder } from '@server/db'
import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import { getSurveyDBSchema } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

import { buildQualifierFiltersSqlConditions } from './qualifierFiltersSqlConditions'

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

const rootDataAlias = 'root_data'

// conditions on the root entity data view: records filter (sent by the client) and user group qualifiers
const getRootDataConditions = ({ filterBySurveyAttrs, recordAccessFilters }) => {
  const filter = filterBySurveyAttrs?.filter
  const { clause: filterClause = null, params: filterParams = {} } = filter
    ? Expression.toSql(
        filter,
        {},
        {
          allowedIdentifiers: new Set(filterBySurveyAttrs.filterColumnNames ?? []),
          tableAlias: rootDataAlias,
        }
      )
    : {}
  const { condition: qualifiersCondition, params: qualifierParams } = buildQualifierFiltersSqlConditions({
    qualifierNodeDefFilters: recordAccessFilters?.qualifierNodeDefFilters ?? [],
    readableQualifierNodeDefFilterSets: recordAccessFilters?.readableQualifierNodeDefFilterSets,
    tableAlias: rootDataAlias,
  })
  const conditions = [filterClause, qualifiersCondition].filter(Boolean).map((condition) => `(${condition})`)
  return { conditions, params: { ...filterParams, ...qualifierParams } }
}

const getRootDataClause = ({ surveyRdbSchema, rootDataViewName, rootDataConditions }) => {
  if (rootDataConditions.length === 0) return ''
  if (!rootDataViewName) {
    throw new Error('rootDataViewName is required to filter the validation report')
  }
  return `
      AND EXISTS (
        SELECT 1
        FROM ${surveyRdbSchema}.$/rootDataViewName:name/ ${rootDataAlias}
        WHERE ${rootDataAlias}.record_uuid = r.uuid
          AND ${rootDataAlias}.record_cycle = r.cycle
          AND ${rootDataConditions.join(' AND ')}
      )`
}

// an empty selection (array) matches no rows, a missing one (null) doesn't filter
const getSelectionFilterClause = ({ values, clause }) => {
  if (!Array.isArray(values)) return ''
  return values.length === 0 ? 'AND 1 = 0' : clause
}

const query = ({
  surveyId,
  recordUuid,
  rootDataViewName = null,
  filterBySurveyAttrs = null,
  recordAccessFilters = null,
  sortBy,
  sortOrder,
}) => {
  const surveySchema = getSurveyDBSchema(surveyId)
  const surveyRdbSchema = SchemaRdb.getName(surveyId)
  const uuidLength = 36
  const attributeDefUuids = filterBySurveyAttrs?.attributeDefUuids
  const messageTypeKeys = filterBySurveyAttrs?.messageTypeKeys
  const ownerUuid = recordAccessFilters?.ownerUuid ?? null

  const { conditions: rootDataConditions, params: rootDataParams } = getRootDataConditions({
    filterBySurveyAttrs,
    recordAccessFilters,
  })
  const rootDataClause = getRootDataClause({ surveyRdbSchema, rootDataViewName, rootDataConditions })
  const filterByAttributeDefsClause = getSelectionFilterClause({
    values: attributeDefUuids,
    clause: 'AND n.node_def_uuid IN ($/attributeDefUuids:csv/)',
  })
  const filterByMessageTypesClause = getSelectionFilterClause({
    values: messageTypeKeys,
    clause: `AND jsonb_path_query_array(nv.validation, '$.**.key') ?| ARRAY[$/messageTypeKeys:csv/]::text[]`,
  })

  const orderByClause = getOrderByClause({ sortBy, sortOrder })

  const text = `WITH node_validation AS (
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
      r.date_modified as record_date_modified,
      u.name as record_owner_name,
      n.id AS node_id,
      n.uuid AS node_uuid,
      n.node_def_uuid,
      nv.validation_count_child_def_uuid,
      nv.validation,
      
      -- TODO: check why subquery is faster than outer join when joining _node_keys_hierarchy view
      (SELECT h.keys_self 
        FROM ${surveyRdbSchema}._node_keys_hierarchy h
        WHERE h.node_uuid = n.uuid
      ),
      (SELECT h.keys_hierarchy 
        FROM ${surveyRdbSchema}._node_keys_hierarchy h
        WHERE h.node_uuid = n.uuid
      )
    FROM
      ${surveySchema}.record r
      -- only the user columns needed
      JOIN (SELECT uuid, name FROM "user") u
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
      ${ownerUuid ? 'AND r.owner_uuid = $/ownerUuid/' : ''}
      ${rootDataClause}
      ${filterByAttributeDefsClause}
      ${filterByMessageTypesClause}
    ORDER BY ${orderByClause}`

  return {
    text,
    params: {
      ...rootDataParams,
      ...(attributeDefUuids?.length > 0 ? { attributeDefUuids } : {}),
      ...(messageTypeKeys?.length > 0 ? { messageTypeKeys } : {}),
      ...(rootDataViewName ? { rootDataViewName } : {}),
      ...(ownerUuid ? { ownerUuid } : {}),
    },
  }
}

const _rowToItem = A.camelizePartial({ limitToLevel: 1, sideEffect: true })

export const fetchValidationReport = async (
  {
    surveyId,
    cycle,
    offset = 0,
    limit = null,
    recordUuid = null,
    rootDataViewName = null,
    filterBySurveyAttrs = null,
    recordAccessFilters = null,
    sortBy,
    sortOrder,
  },
  client = db
) => {
  const { text, params } = query({
    surveyId,
    recordUuid,
    rootDataViewName,
    filterBySurveyAttrs,
    recordAccessFilters,
    sortBy,
    sortOrder,
  })
  return client.map(
    `${text}
      LIMIT $/limit/
      OFFSET $/offset/`,
    { cycle, limit, offset, recordUuid, ...params },
    _rowToItem
  )
}

export const countValidationReportItems = async (
  {
    surveyId,
    cycle,
    recordUuid = null,
    rootDataViewName = null,
    filterBySurveyAttrs = null,
    recordAccessFilters = null,
  },
  client = db
) => {
  const { text, params } = query({ surveyId, recordUuid, rootDataViewName, filterBySurveyAttrs, recordAccessFilters })
  return client.one(`SELECT COUNT(*) FROM(${text}) AS v`, { cycle, recordUuid, ...params }, (row) => Number(row.count))
}

export const getValidationReportAsStream = (
  {
    surveyId,
    cycle,
    recordUuid = null,
    rootDataViewName = null,
    filterBySurveyAttrs = null,
    recordAccessFilters = null,
    processor,
  },
  client = db
) => {
  const { text, params } = query({ surveyId, recordUuid, rootDataViewName, filterBySurveyAttrs, recordAccessFilters })
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
