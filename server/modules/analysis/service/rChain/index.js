import * as PromiseUtils from '@core/promiseUtils'
import * as fs from 'fs'
import * as path from 'path'
import * as csv from 'fast-csv'

import { db } from '@server/db/db'

import FileZip from '@server/utils/file/fileZip'
import * as FileUtils from '@server/utils/file/fileUtils'
import { persistOlapData as persistOlapDataToFile } from './rFile/system/rFilePersistOlapData'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as RecordStep from '@core/record/recordStep'

import { TableChain } from '@common/model/db'
import { Query } from '@common/model/query'
import * as Chain from '@common/analysis/chain'

import * as JobManager from '@server/job/jobManager'
import * as UserService from '@server/modules/user/service/userService'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'
import * as AnalysisManager from '../../manager'
import * as RChainResultService from '../rChainResultService'

import RChain from './rChain'
import PersistResultsJob from './PersistResultsJob'

export const generateScript = async ({ surveyId, cycle, chainUuid, serverUrl, token }) =>
  new RChain({ surveyId, cycle, chainUuid, serverUrl, token }).init()

// ==== READ
export const fetchNodeData = async ({ res, surveyId, cycle, chainUuid, nodeDefUuid, draft = true }) => {
  // prepare query
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
    surveyId,
    cycle,
    advanced: true,
    draft,
    includeAnalysis: false,
  })
  const chain = await AnalysisManager.fetchChain({ surveyId, chainUuid })
  const recordSteps = Chain.isSubmitOnlyAnalysisStepDataIntoR(chain)
    ? [RecordStep.getStepIdByName(RecordStep.stepNames.analysis)]
    : null
  const filterRecordUuids = Chain.isSubmitOnlySelectedRecordsIntoR(chain) ? Chain.getSelectedRecordUuids(chain) : null
  const query = Query.create({ entityDefUuid: nodeDefUuid, filterRecordUuids })

  // fetch data
  return SurveyRdbManager.fetchViewData({
    survey,
    cycle,
    recordSteps,
    query,
    columnNodeDefs: true,
    includeFileAttributeDefs: false,
    addCycle: true,
    nullsToEmpty: true,
    streamOutput: res,
  })
}

// ==== UPDATE

export const startPersistResultsJob = ({ user, surveyId, cycle, entityDefUuid, chainUuid, filePath }) => {
  const job = new PersistResultsJob({ user, surveyId, cycle, chainUuid, nodeDefUuid: entityDefUuid, filePath })
  JobManager.enqueueJob(job)
  return job
}

const getAnalysisNodeDefZipEntryName = ({ entity, nodeDef }) => {
  const nodeDefName = NodeDef.getName(nodeDef)

  if (NodeDef.isBaseUnit(nodeDef)) {
    return `base-unit-${nodeDefName}`
  }
  if (NodeDef.isSampling(nodeDef) && !NodeDef.isAreaBasedEstimatedOf(nodeDef)) {
    return nodeDefName.replace(`${NodeDef.getName(entity)}_`, `${NodeDef.getName(entity)}-`)
  }
  return `${NodeDef.getName(entity)}-${nodeDefName}`
}

export const saveStatisticalData = async ({ surveyId, cycle, entityDefUuid, chainUuid, filePath, user, fileName }) => {
  const fileZip = new FileZip(filePath)
  await fileZip.init()

  // Extract the zip file to a temporary directory
  const tempDir = path.join(process.env.TEMP_FOLDER || '/tmp', `statistical_${Date.now()}`)
  await FileUtils.mkdir(tempDir, { recursive: true })

  try {
    // Extract the OLAP CSV file from the zip
    const entryNames = fileZip.getEntryNames()
    const csvEntryName = entryNames.find((name) => name.endsWith('.csv'))

    if (!csvEntryName) {
      throw new Error('No CSV file found in the zip archive')
    }

    const csvData = await fileZip.getEntryAsText(csvEntryName)
    const csvFilePath = path.join(tempDir, csvEntryName)
    await fs.promises.writeFile(csvFilePath, csvData)

    // Parse the CSV file
    const rows = []
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv.parse({ headers: true }))
        .on('data', (row) => rows.push(row))
        .on('error', reject)
        .on('end', resolve)
    })

    // Save the data to the database
    await RChainResultService.saveResultToCsv({
      surveyId,
      chainUuid,
      cycle,
      entityDef: { uuid: entityDefUuid },
      data: rows,
      tx: db,
    })

    return { success: true, rowCount: rows.length }
  } finally {
    // Clean up temporary files
    await FileUtils.rmdir(tempDir, { recursive: true })
  }
}

export const persistOlapData = async ({ surveyId, cycle, chainUuid, data }) => {
  // Fetch survey and chain
  const [survey, chain] = await Promise.all([
    SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle, advanced: true, draft: true }),
    AnalysisManager.fetchChain({ surveyId, chainUuid, includeScript: true }),
  ])

  // Create output directory
  const outputDir = path.join(process.env.TEMP_FOLDER || '/tmp', 'olap_data', surveyId, chainUuid)

  // Persist OLAP data to a CSV file
  const filePath = await persistOlapDataToFile({
    survey,
    chain,
    data,
    outputDir,
  })

  return filePath
}

export const persistUserScripts = async ({ user, surveyId, chainUuid, filePath }) => {
  const fileZip = new FileZip(filePath)
  await fileZip.init()

  const entryNames = fileZip.getEntryNames({ onlyFirstLevel: false })

  const findEntry = ({ folderNames = [RChain.dirNames.user, RChain.dirNames.sampling], name }) =>
    entryNames.find((entryName) =>
      folderNames.some((folder) => new RegExp(`^${folder}\\/\\d{3}-${name}\\.R$`).test(entryName))
    )

  const getZipEntryAsText = (name) => fileZip.getEntryAsText(findEntry({ name }))?.trim()

  await db.tx(async (tx) => {
    // Persist common and end scripts
    const scriptCommon = getZipEntryAsText('common')
    const scriptEnd = getZipEntryAsText('common-end')

    await AnalysisManager.updateChain(
      {
        surveyId,
        chainUuid,
        fields: {
          [TableChain.columnSet.scriptCommon]: scriptCommon,
          [TableChain.columnSet.scriptEnd]: scriptEnd,
        },
      },
      tx
    )

    const [chain, survey] = await Promise.all([
      AnalysisManager.fetchChain({ surveyId, chainUuid, includeScript: true }, tx),
      SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, advanced: true, draft: true }),
    ])

    const entities = Survey.getAnalysisEntities({ chain })(survey)

    await PromiseUtils.each(entities, async (entity) => {
      const analysisNodeDefsInEntity = Survey.getAnalysisNodeDefs({ entity, chain, hideAreaBasedEstimate: false })(
        survey
      )

      if (analysisNodeDefsInEntity.length > 0) {
        await PromiseUtils.each(analysisNodeDefsInEntity, async (nodeDef) => {
          const nodeDefUuid = NodeDef.getUuid(nodeDef)
          const parentUuid = NodeDef.getParentUuid(nodeDef)

          const scriptEntryName = getAnalysisNodeDefZipEntryName({ entity, nodeDef })

          const script = getZipEntryAsText(scriptEntryName)

          await NodeDefManager.updateNodeDefProps(
            { user, survey, nodeDefUuid, parentUuid, propsAdvanced: { script }, markSurveyAsDraft: false },
            tx
          )
        })
      }
    })
  })
  await UserService.notifyActiveUsersAboutSurveyUpdate({ surveyId })
}
