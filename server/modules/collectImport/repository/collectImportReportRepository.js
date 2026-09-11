import * as CollectImportReportItem from '@core/survey/collectImportReportItem'
import * as NodeDef from '@core/survey/nodeDef'

import * as DbUtils from '@server/db/dbUtils'
import * as ImportReportRepository from '@server/modules/importReport/repository/importReportRepository'

import { getSurveyDBSchema } from '../../survey/repository/surveySchemaRepositoryUtils'

// Table-level CRUD (fetchItems/countItems/insertItem/insertItems/updateItem) is shared with the ODK
// importer via ImportReportRepository - see its header comment and
// docs/superpowers/plans/2026-09-11-odk-import-4-hardening.md. Only fetchItemsStream stays here: its
// per-language `messages` column projection is specific to Collect's report-item prop shape.
const source = 'collect'

export const fetchItems = async ({ surveyId, excludeResolved = false, offset = 0, limit = null }, client) =>
  ImportReportRepository.fetchItems({ surveyId, source, excludeResolved, offset, limit }, client)

export const fetchItemsStream = async ({ surveyId, messageLangCode }) => {
  const select = `
      SELECT
        cr.id,
        cr.node_def_uuid,
        (nd.props_draft || nd.props)->>'${NodeDef.propKeys.name}' as node_def_name,
        (cr.props)->>'${CollectImportReportItem.propKeys.expressionType}' as type,
        (cr.props)->>'${CollectImportReportItem.propKeys.expression}' as expression,
        (cr.props)->>'${CollectImportReportItem.propKeys.applyIf}' as apply_if,
        (cr.props)#>>'{${CollectImportReportItem.propKeys.messages},${messageLangCode}}' as message,
        cr.props as props,
        cr.resolved as resolved
      FROM ${getSurveyDBSchema(surveyId)}.import_report cr
      JOIN ${getSurveyDBSchema(surveyId)}.node_def nd on nd.uuid = cr.node_def_uuid
      WHERE cr.source = 'collect'
      ORDER BY id
   `

  return new DbUtils.QueryStream(DbUtils.formatQuery(select, []))
}

export const countItems = async ({ surveyId, excludeResolved }, client) =>
  ImportReportRepository.countItems({ surveyId, source, excludeResolved }, client)

export const insertItem = async (surveyId, item, client) =>
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

export const insertItems = async ({ surveyId, items = [] }, client) =>
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

export const updateItem = async (surveyId, itemId, props, resolved, client) =>
  ImportReportRepository.updateItem(surveyId, source, itemId, props, resolved, client)
