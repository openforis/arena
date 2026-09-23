import fs from 'fs'
import os from 'os'
import path from 'path'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import { getExtensionByFileFormat } from '@core/fileFormats'

import * as RecordManager from '@server/modules/record/manager/recordManager'
import DataImportJob from '@server/modules/dataImport/service/DataImportJob/DataImportJob'
import DataImportValidationJob from '@server/modules/dataImport/service/DataImportValidationJob'

import * as SB from '../../../utils/surveyBuilder'
import { toFileContent } from '../../../utils/flatDataImportTestUtils'

const clusterName = 'cluster'
const clusterIdName = 'cluster_id'
const plotsCountName = 'plots_count'
const plotName = 'plot'
const plotIdName = 'plot_id'
const plotSizeName = 'plot_size'
const plotSizeDoubleName = 'plot_size_double'

// plots_count and plot_size_double are calculated (dependent) attributes: they must be updated
// by the import even if the dependents update is done once per record, and not per imported attribute.
const _buildSurvey = ({ user }) =>
  SB.survey(
    user,
    SB.entity(
      clusterName,
      SB.attribute(clusterIdName, NodeDef.nodeDefType.integer).key(),
      SB.attribute(plotsCountName, NodeDef.nodeDefType.integer)
        .readOnly()
        .defaultValues(NodeDefExpression.createExpression({ expression: `count(${plotName}.${plotIdName})` })),
      SB.entity(
        plotName,
        SB.attribute(plotIdName, NodeDef.nodeDefType.integer).key(),
        SB.attribute(plotSizeName, NodeDef.nodeDefType.integer),
        SB.attribute(plotSizeDoubleName, NodeDef.nodeDefType.integer)
          .readOnly()
          .defaultValues(NodeDefExpression.createExpression({ expression: `${plotSizeName} * 2` }))
      ).multiple()
    )
  ).buildAndStore()

const _writeTempFile = async ({ fileFormat, rows }) => {
  const extension = getExtensionByFileFormat(fileFormat)
  const filePath = path.join(os.tmpdir(), `arena_data_import_test_${Date.now()}_${Math.random()}.${extension}`)
  fs.writeFileSync(filePath, await toFileContent({ fileFormat, rows }))
  return filePath
}

// the job deletes the file when it ends
const _runImport = async ({ user, survey, entityName, fileFormat, rows, JobClass = DataImportJob, ...params }) => {
  const entityDef = Survey.getNodeDefByName(entityName)(survey)
  const job = new JobClass({
    user,
    surveyId: Survey.getId(survey),
    filePath: await _writeTempFile({ fileFormat, rows }),
    fileFormat,
    abortOnErrors: true,
    cycle: Survey.cycleOneKey,
    nodeDefUuid: NodeDef.getUuid(entityDef),
    ...params,
  })
  await job.start()
  return job
}

const _getChildValue = ({ survey, record, parentNode, childName }) => {
  const childDef = Survey.getNodeDefByName(childName)(survey)
  const child = Record.getNodeChildByDefUuid(parentNode, NodeDef.getUuid(childDef))(record)
  return child ? Node.getValue(child) : undefined
}

const _fetchRecords = async ({ survey }) => {
  const surveyId = Survey.getId(survey)
  const { list: recordSummaries } = await RecordManager.fetchRecordsSummaryBySurveyId({
    surveyId,
    cycle: Survey.cycleOneKey,
    offset: 0,
    limit: null,
  })
  return Promise.all(
    recordSummaries.map((recordSummary) =>
      RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid: Record.getUuid(recordSummary) })
    )
  )
}

// returns the records as objects like { clusterId, plotsCount, plots: { [plotId]: { size, sizeDouble } } }
const _fetchRecordsSummaries = async ({ survey }) => {
  const records = await _fetchRecords({ survey })
  const plotDef = Survey.getNodeDefByName(plotName)(survey)
  return records
    .map((record) => {
      const root = Record.getRootNode(record)
      const plots = Record.getNodeChildrenByDefUuid(
        root,
        NodeDef.getUuid(plotDef)
      )(record).reduce((acc, plot) => {
        const plotId = _getChildValue({ survey, record, parentNode: plot, childName: plotIdName })
        acc[plotId] = {
          size: _getChildValue({ survey, record, parentNode: plot, childName: plotSizeName }),
          sizeDouble: _getChildValue({ survey, record, parentNode: plot, childName: plotSizeDoubleName }),
        }
        return acc
      }, {})
      return {
        clusterId: Number(_getChildValue({ survey, record, parentNode: root, childName: clusterIdName })),
        plotsCount: _getChildValue({ survey, record, parentNode: root, childName: plotsCountName }),
        plots,
      }
    })
    .sort((a, b) => a.clusterId - b.clusterId)
}

const _expectJobSucceeded = (job) => {
  if (!job.isSucceeded()) {
    throw new Error(`Data import job not succeeded (status: ${job.status}): ${JSON.stringify(job.errors)}`)
  }
}

export const dataImportTest = async ({ user, fileFormat }) => {
  const survey = await _buildSurvey({ user })

  // 1. insert new records (root entity)
  const insertRecordsJob = await _runImport({
    user,
    survey,
    fileFormat,
    entityName: clusterName,
    rows: [[clusterIdName], [1], [2]],
    insertNewRecords: true,
  })
  _expectJobSucceeded(insertRecordsJob)
  expect(insertRecordsJob.result.insertedRecords).toBe(2)
  expect((await _fetchRecordsSummaries({ survey })).map((r) => r.clusterId)).toEqual([1, 2])

  // 2. insert missing plots (nested entity) and check that dependent (calculated) attributes are updated
  const insertPlotsJob = await _runImport({
    user,
    survey,
    fileFormat,
    entityName: plotName,
    rows: [
      [clusterIdName, plotIdName, plotSizeName],
      [1, 1, 10],
      [1, 2, 20],
      [2, 1, 30],
    ],
    insertMissingNodes: true,
  })
  _expectJobSucceeded(insertPlotsJob)

  const recordsAfterInsert = await _fetchRecordsSummaries({ survey })
  expect(recordsAfterInsert).toEqual([
    {
      clusterId: 1,
      plotsCount: 2,
      plots: { 1: { size: 10, sizeDouble: 20 }, 2: { size: 20, sizeDouble: 40 } },
    },
    { clusterId: 2, plotsCount: 1, plots: { 1: { size: 30, sizeDouble: 60 } } },
  ])

  // 3. update existing plots: modified values are stored and dependent attributes are updated; other plots are untouched
  const updatePlotsJob = await _runImport({
    user,
    survey,
    fileFormat,
    entityName: plotName,
    rows: [
      [clusterIdName, plotIdName, plotSizeName],
      [1, 2, 25],
    ],
  })
  _expectJobSucceeded(updatePlotsJob)
  expect(updatePlotsJob.result.updatedRecords).toBe(1)

  const recordsAfterUpdate = await _fetchRecordsSummaries({ survey })
  expect(recordsAfterUpdate[0].plots).toEqual({ 1: { size: 10, sizeDouble: 20 }, 2: { size: 25, sizeDouble: 50 } })
  expect(recordsAfterUpdate[1]).toEqual(recordsAfterInsert[1])

  return survey
}

export const dataImportInvalidValueTest = async ({ user, fileFormat }) => {
  const survey = await _buildSurvey({ user })
  await _runImport({
    user,
    survey,
    fileFormat,
    entityName: clusterName,
    rows: [[clusterIdName], [1]],
    insertNewRecords: true,
  })

  // a row with an invalid value makes the whole import fail and nothing is persisted
  const job = await _runImport({
    user,
    survey,
    fileFormat,
    entityName: plotName,
    rows: [
      [clusterIdName, plotIdName, plotSizeName],
      [1, 1, 10],
      [1, 2, 'not_a_number'],
    ],
    insertMissingNodes: true,
  })
  expect(job.status).toBe('failed')
  expect(Object.keys(job.errors).length).toBeGreaterThan(0)
  expect((await _fetchRecordsSummaries({ survey }))[0].plots).toEqual({})
}

export const dataImportEntityNotFoundTest = async ({ user, fileFormat }) => {
  const survey = await _buildSurvey({ user })
  await _runImport({
    user,
    survey,
    fileFormat,
    entityName: clusterName,
    rows: [[clusterIdName], [1]],
    insertNewRecords: true,
  })

  // insertMissingNodes not specified: importing values into a not existing plot is an error
  const job = await _runImport({
    user,
    survey,
    fileFormat,
    entityName: plotName,
    rows: [
      [clusterIdName, plotIdName, plotSizeName],
      [1, 1, 10],
    ],
  })
  expect(job.status).toBe('failed')
  expect((await _fetchRecordsSummaries({ survey }))[0].plots).toEqual({})
}

export const dataImportRecordNotFoundTest = async ({ user, fileFormat }) => {
  const survey = await _buildSurvey({ user })

  const job = await _runImport({
    user,
    survey,
    fileFormat,
    entityName: plotName,
    rows: [
      [clusterIdName, plotIdName, plotSizeName],
      [99, 1, 10],
    ],
    insertMissingNodes: true,
  })
  expect(job.status).toBe('failed')
  expect(await _fetchRecordsSummaries({ survey })).toEqual([])
}

export const dataImportDryRunTest = async ({ user, fileFormat }) => {
  const survey = await _buildSurvey({ user })
  await _runImport({
    user,
    survey,
    fileFormat,
    entityName: clusterName,
    rows: [[clusterIdName], [1]],
    insertNewRecords: true,
  })

  const job = await _runImport({
    user,
    survey,
    fileFormat,
    entityName: plotName,
    rows: [
      [clusterIdName, plotIdName, plotSizeName],
      [1, 1, 10],
    ],
    insertMissingNodes: true,
    dryRun: true,
    JobClass: DataImportValidationJob,
  })
  _expectJobSucceeded(job)
  // validation only: nothing has been persisted
  expect((await _fetchRecordsSummaries({ survey }))[0].plots).toEqual({})
}
