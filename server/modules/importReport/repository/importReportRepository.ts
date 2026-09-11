import * as R from 'ramda'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

import { getSurveyDBSchema, dbTransformCallback } from '../../survey/repository/surveySchemaRepositoryUtils'

// Shared, source-agnostic CRUD over the `import_report` table - see
// arena-server's 20260911194436-generalize-collect-import-report-to-import-report migration. The table
// was `collect_import_report` until this migration generalized it to also hold ODK import review items,
// distinguished by the `source` column added here, rather than duplicating an identical table per
// importer (see docs/superpowers/plans/2026-09-11-odk-import-4-hardening.md). Every function here takes
// the calling importer's `source` ('collect' | 'odk') and always operates only on that importer's rows -
// callers never see another source's report items. The one report operation NOT here,
// `fetchItemsStream`, stays in each source-specific repository, since the two importers' report-item
// `props` shapes genuinely differ (Collect: per-language `messages`; ODK: a single `message`) enough that
// the flat-column SQL projection used for CSV/XLSX export can't be shared - it still targets the same
// `import_report` table, filtered by `source`.

export type ImportReportSource = 'collect' | 'odk'

const table = 'import_report'

const _getSelectWhereCondition = ({ excludeResolved }: { excludeResolved: boolean }) =>
  `WHERE source = $/source/${excludeResolved ? ' AND resolved = FALSE' : ''}`

export const fetchItems = async (
  {
    surveyId,
    source,
    excludeResolved = false,
    offset = 0,
    limit = null,
  }: {
    surveyId: number
    source: ImportReportSource
    excludeResolved?: boolean
    offset?: number
    limit?: number | null
  },
  client: any = db
) =>
  client.map(
    `
      SELECT *
      FROM ${getSurveyDBSchema(surveyId)}.${table}
      ${_getSelectWhereCondition({ excludeResolved })}
      ORDER BY id
      LIMIT ${limit ? '$/limit/' : 'ALL'}
      OFFSET $/offset/
    `,
    { source, limit, offset },
    dbTransformCallback
  )

export const countItems = async (
  { surveyId, source, excludeResolved }: { surveyId: number; source: ImportReportSource; excludeResolved: boolean },
  client: any = db
) =>
  client.one(
    `
      SELECT COUNT(*) as tot
      FROM ${getSurveyDBSchema(surveyId)}.${table}
      ${_getSelectWhereCondition({ excludeResolved })}
    `,
    { source },
    R.prop('tot')
  )

export const insertItem = async (
  surveyId: number,
  source: ImportReportSource,
  item: { nodeDefUuid: string; props: any; resolved: boolean },
  client: any = db
) =>
  client.one(
    `
      INSERT INTO ${getSurveyDBSchema(surveyId)}.${table} (node_def_uuid, props, resolved, source)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [item.nodeDefUuid, item.props, item.resolved, source],
    dbTransformCallback
  )

export const insertItems = async (
  {
    surveyId,
    source,
    items = [],
  }: { surveyId: number; source: ImportReportSource; items?: { nodeDefUuid: string; props: any; resolved: boolean }[] },
  client: any = db
) =>
  items.length > 0 &&
  client.none(
    DbUtils.insertAllQueryBatch(
      getSurveyDBSchema(surveyId),
      table,
      ['node_def_uuid', 'props', 'resolved', 'source'],
      items.map((item) => ({
        node_def_uuid: item.nodeDefUuid,
        props: item.props,
        resolved: item.resolved,
        source,
      }))
    )
  )

export const updateItem = async (
  surveyId: number,
  source: ImportReportSource,
  itemId: number,
  props: any,
  resolved: boolean,
  client: any = db
) =>
  client.one(
    `
      UPDATE ${getSurveyDBSchema(surveyId)}.${table}
      SET
        props = props || $3::jsonb,
        resolved = $4,
        date_modified = ${DbUtils.now}
      WHERE id = $1 AND source = $2
      RETURNING *
    `,
    [itemId, source, props, resolved],
    dbTransformCallback
  )
