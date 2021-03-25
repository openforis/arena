import * as DateUtils from '@core/dateUtils'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessUtils from '@core/processUtils'
import * as Survey from '@core/survey/survey'

import * as FileUtils from '@server/utils/file/fileUtils'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

import { db } from '../../../db/db'
import * as CSVWriter from '../../../utils/file/csvWriter'

import { ColumnNodeDef, ViewDataNodeDef } from '../../../../common/model/db'

import { Query } from '../../../../common/model/query'
import * as NodeDefTable from '../../../../common/surveyRdb/nodeDefTable'

import * as DataTableInsertRepository from '../repository/dataTableInsertRepository'
import * as DataTableReadRepository from '../repository/dataTableReadRepository'
import * as DataTableRepository from '../repository/dataTable'
import * as DataViewRepository from '../repository/dataView'

// ==== DDL

// schema
export { createSchema, dropSchema, getTables } from '../repository/schemaRdbRepository'

// Data tables and views
export const { createDataTable } = DataTableRepository
export const { createDataView, countViewDataAgg, fetchViewDataAgg, _fetchViewData } = DataViewRepository

// Node key views
export { createNodeKeysView } from '../repository/nodeKeysViewRepository'
export { createNodeHierarchyDisaggregatedView } from '../repository/nodeHierarchyDisaggregatedViewRepository'
export { createNodeKeysHierarchyView } from '../repository/nodeKeysHierarchyViewRepository'

// Result tables and views
export { createResultNodeTable, deleteNodeResultsByChainUuid, MassiveInsertResultNodes } from '../repository/resultNode'
export { createResultStepView, refreshResultStepView } from '../repository/resultStep'

// ==== DML

const _getExportFields = ({ survey, query }) => {
  const nodeDef = Survey.getNodeDefByUuid(Query.getEntityDefUuid(query))(survey)
  const viewDataNodeDef = new ViewDataNodeDef(survey, nodeDef)
  // Consider only user selected fields (from column node defs)
  const nodeDefUuidCols = Query.getAttributeDefUuids(query)
  const nodeDefCols = Survey.getNodeDefsByUuids(nodeDefUuidCols)(survey)
  return nodeDefCols.map((nodeDefCol) => new ColumnNodeDef(viewDataNodeDef, nodeDefCol).names).flat()
}

/**
 * Executes a select query on an entity definition data view.
 *
 * @param {!object} params - The query parameters.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!Query} [params.query] - The Query to execute.
 * @param {boolean} [params.columnNodeDefs=false] - Whether to select only columnNodes.
 * @param {number} [params.offset=null] - The query offset.
 * @param {number} [params.limit=null] - The query limit.
 * @param {boolean} [params.streamOutput=null] - The output to be used to stream the data (if specified).
 *
 * @returns {Promise<any[]>} - An object with fetched rows and selected fields.
 */
export const fetchViewData = async (params) => {
  const { survey, cycle, query, columnNodeDefs = false, offset = 0, limit = null, streamOutput = null } = params

  // Fetch data
  const result = await DataViewRepository.fetchViewData({
    survey,
    cycle,
    query,
    columnNodeDefs,
    offset,
    limit,
    stream: Boolean(streamOutput),
  })

  if (streamOutput) {
    await db.stream(result, (stream) => {
      const fields = _getExportFields({ survey, query })
      stream.pipe(CSVWriter.transformToStream(streamOutput, fields))
    })
  }
  return result
}

export const fetchEntitiesDataToCsvFiles = async ({ surveyId }, client) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(surveyId, null, true, false, false, false, client)

  const surveyInfo = Survey.getSurveyInfo(survey)
  const surveyName = Survey.getName(surveyInfo)

  const exportDataFolderName = `${surveyName}_export_${DateUtils.nowFormatDefault()}`
  const dir = FileUtils.join(ProcessUtils.ENV.tempFolder, exportDataFolderName)
  await FileUtils.rmdir(dir)
  await FileUtils.mkdir(dir)

  const entities = Survey.getNodeDefsArray(survey).filter(NodeDef.isEntity)

  await Promise.all(
    entities.map(async (entity) => {
      const entityDefUuid = NodeDef.getUuid(entity)
      const stream = FileUtils.createWriteSteam(FileUtils.join(dir, `${NodeDef.getName(entity)}.csv`))

      const nodeDefContext = Survey.getNodeDefByUuid(entityDefUuid)(survey)

      let childDefs = []
      if (nodeDefContext) {
        childDefs = NodeDef.isEntity(nodeDefContext)
          ? Survey.getNodeDefChildren(nodeDefContext, true)(survey)
          : [nodeDefContext] // Multiple attribute
      }

      const result = await _fetchViewData({ survey, entityDefUuid, columnNodeDefs: childDefs })

      const headers = childDefs.reduce(
        (acc, nodeDef) => (NodeDef.isEntity(nodeDef) ? acc : [...acc, ...NodeDefTable.getColNames(nodeDef)]),
        []
      )

      await db.stream(result, (streamQuery) => {
        streamQuery.pipe(CSVWriter.transformToStream(stream, headers))
      })
    })
  )

  return { exportDataFolderName, dir }
}
/**
 * Counts the number of rows in the data view related to the specified query object.
 *
 * @param {!object} params - The query parameters.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!Query} [params.query] - The Query used to filter the rows.
 *
 * @returns {Promise<number>} - The number of rows.
 */
export const countTable = async ({ survey, cycle, query }) => {
  const surveyId = Survey.getId(survey)
  const nodeDefTable = Survey.getNodeDefByUuid(Query.getEntityDefUuid(query))(survey)
  const tableName = NodeDefTable.getViewName(nodeDefTable, Survey.getNodeDefParent(nodeDefTable)(survey))
  const filter = Query.getFilter(query)
  return DataViewRepository.runCount({ surveyId, cycle, tableName, filter })
}

export const { populateTable } = DataTableInsertRepository

export const { fetchRecordsWithDuplicateEntities } = DataTableReadRepository
