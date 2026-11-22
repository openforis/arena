import type { DbClient } from '@server/db/db'
import * as CollectImportReportItem from '@core/survey/collectImportReportItem'
import * as NodeDef from '@core/survey/nodeDef'

import * as DbUtils from '@server/db/dbUtils'
import * as ImportReportRepository from '@server/modules/importReport/repository/importReportRepository'

import { Schemata } from '@common/model/db'

// Table-level CRUD (fetchItems/countItems/insertItem/insertItems/updateItem) is shared with the ODK
// importer via ImportReportRepository - see its header comment and
// docs/superpowers/plans/2026-09-11-odk-import-4-hardening.md. Only fetchItemsStream stays here: its
// per-language `messages` column projection is specific to Collect's report-item prop shape.
const source = 'collect'

export const fetchItems = (
  {
    surveyId,
    excludeResolved = false,
    offset = 0,
    limit = null,
  }: { surveyId: number; excludeResolved?: boolean; offset?: number; limit?: number | null },
  client?: DbClient
) => ImportReportRepository.fetchItems({ surveyId, source, excludeResolved, offset, limit }, client)

export const fetchItemsStream = ({ surveyId, messageLangCode }: { surveyId: number; messageLangCode: any }) => {
  const select = `
      SELECT
        cr.id,
        cr.node_def_uuid,
        (nd.props_draft || nd.props)->>'${NodeDef.propKeys.name}' as node_def_name,
        (cr.props)->>'${CollectImportReportItem.propKeys.expressionType}' as type,
        (cr.props)->>'${CollectImportReportItem.propKeys.expression}' as expression,
        (cr.props)->>'${CollectImportReportItem.propKeys.applyIf}' as apply_if,
        (cr.props)#>>$/messagePath/::text[] as message,
        cr.props as props,
        cr.resolved as resolved
      FROM ${Schemata.getSchemaSurvey(surveyId)}.import_report cr
      JOIN ${Schemata.getSchemaSurvey(surveyId)}.node_def nd on nd.uuid = cr.node_def_uuid
      WHERE cr.source = 'collect'
      ORDER BY id
   `

  return new DbUtils.QueryStream(
    DbUtils.formatQuery(select, { messagePath: [CollectImportReportItem.propKeys.messages, messageLangCode] })
  )
}

export const countItems = (
  { surveyId, excludeResolved }: { surveyId: number; excludeResolved: boolean },
  client?: DbClient
) => ImportReportRepository.countItems({ surveyId, source, excludeResolved }, client)

export const insertItem = (surveyId: number, item: any, client: DbClient) =>
  ImportReportRepository.insertItem(
    surveyId,
    source,
    {
      nodeDefUuid: CollectImportReportItem.getNodeDefUuid(item),
      props: CollectImportReportItem.getProps(item),
      resolved: CollectImportReportItem.isResolved(item),
    },
    client
  )

export const insertItems = ({ surveyId, items = [] }: { surveyId: number; items?: any[] }, client: DbClient) =>
  ImportReportRepository.insertItems(
    {
      surveyId,
      source,
      items: items.map((item) => ({
        nodeDefUuid: CollectImportReportItem.getNodeDefUuid(item),
        props: CollectImportReportItem.getProps(item),
        resolved: CollectImportReportItem.isResolved(item),
      })),
    },
    client
  )

export const updateItem = (
  surveyId: number,
  itemId: number,
  props: Record<string, any>,
  resolved: boolean,
  client: DbClient
) => ImportReportRepository.updateItem(surveyId, source, itemId, props, resolved, client)
