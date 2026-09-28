import * as NodeDef from '@core/survey/nodeDef'
import * as OdkImportReportItem from '@core/survey/odkImportReportItem'

import { Schemata } from '@common/model/db'

import * as DbUtils from '@server/db/dbUtils'
import * as ImportReportRepository from '@server/modules/importReport/repository/importReportRepository'

// Table-level CRUD (fetchItems/countItems/insertItem/insertItems/updateItem) is shared with the Collect
// importer via ImportReportRepository - see its header comment and
// docs/superpowers/plans/2026-09-11-odk-import-4-hardening.md. Only fetchItemsStream stays here: its
// single-`message` column projection is specific to ODK's report-item prop shape (no per-language
// `messages`, since ODK report messages are derived from XForm paths/type names, not translated text).
const source = 'odk'

export const fetchItems = async (
  {
    surveyId,
    excludeResolved = false,
    offset = 0,
    limit = null,
  }: { surveyId: number; excludeResolved?: boolean; offset?: number; limit?: number | null },
  client?: any
) => ImportReportRepository.fetchItems({ surveyId, source, excludeResolved, offset, limit }, client)

export const fetchItemsStream = async ({ surveyId }: { surveyId: number }) => {
  const select = `
      SELECT
        ir.id,
        ir.node_def_uuid,
        (nd.props_draft || nd.props)->>'${NodeDef.propKeys.name}' as node_def_name,
        (ir.props)->>'${OdkImportReportItem.propKeys.itemType}' as type,
        (ir.props)->>'${OdkImportReportItem.propKeys.expression}' as expression,
        (ir.props)->>'${OdkImportReportItem.propKeys.message}' as message,
        ir.props as props,
        ir.resolved as resolved
      FROM ${Schemata.getSchemaSurvey(surveyId)}.import_report ir
      JOIN ${Schemata.getSchemaSurvey(surveyId)}.node_def nd on nd.uuid = ir.node_def_uuid
      WHERE ir.source = 'odk'
      ORDER BY id
   `

  return new DbUtils.QueryStream(DbUtils.formatQuery(select, []))
}

export const countItems = async (
  { surveyId, excludeResolved }: { surveyId: number; excludeResolved: boolean },
  client?: any
) => ImportReportRepository.countItems({ surveyId, source, excludeResolved }, client)

export const insertItem = async (surveyId: number, item: any, client?: any) =>
  ImportReportRepository.insertItem(
    surveyId,
    source,
    {
      nodeDefUuid: OdkImportReportItem.getNodeDefUuid(item),
      props: OdkImportReportItem.getProps(item),
      resolved: OdkImportReportItem.isResolved(item),
    },
    client
  )

export const insertItems = async ({ surveyId, items = [] }: { surveyId: number; items?: any[] }, client?: any) =>
  ImportReportRepository.insertItems(
    {
      surveyId,
      source,
      items: items.map((item) => ({
        nodeDefUuid: OdkImportReportItem.getNodeDefUuid(item),
        props: OdkImportReportItem.getProps(item),
        resolved: OdkImportReportItem.isResolved(item),
      })),
    },
    client
  )

export const updateItem = async (surveyId: number, itemId: number, props: any, resolved: boolean, client?: any) =>
  ImportReportRepository.updateItem(surveyId, source, itemId, props, resolved, client)
