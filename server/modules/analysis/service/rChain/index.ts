import type { Response as ExpressResponse } from 'express'

import type { ArenaAnyNodeDef, ArenaNodeDefEntity, ArenaUser } from '@openforis/arena-core'

import * as Chain from '@common/analysis/chain'
import { TableChain } from '@common/model/db'
import { Query } from '@common/model/query'
import { FileFormats } from '@core/fileFormats'
import * as RecordStep from '@core/record/recordStep'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { db } from '@server/db/db'
import * as JobManager from '@server/job/jobManager'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'
import * as UserService from '@server/modules/user/service/userService'
import FileZip from '@server/utils/file/fileZip'
import * as AnalysisManager from '../../manager'
import PersistOlapDataJob from '../olap/persistOlapDataJob'

import PersistResultsJob from './persistResultsJob'
import RChain from './rChain'

export const generateScript = ({
  surveyId,
  cycle,
  chainUuid,
  serverUrl,
  token,
}: {
  surveyId: number
  cycle: string
  chainUuid: string
  serverUrl: string
  token: string
}) => new RChain({ surveyId, cycle, chainUuid, serverUrl, token }).init()

// ==== READ
export const fetchNodeData = async ({
  res,
  surveyId,
  cycle,
  chainUuid,
  nodeDefUuid,
  draft = true,
  fileFormat = FileFormats.csv,
}: {
  res: ExpressResponse
  surveyId: number
  cycle: string
  chainUuid: string
  nodeDefUuid: string
  draft?: boolean
  fileFormat?: string
}) => {
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
    outputStream: res,
    fileFormat,
  })
}

// ==== UPDATE

export const startPersistResultsJob = ({
  user,
  surveyId,
  cycle,
  entityDefUuid,
  chainUuid,
  filePath,
}: {
  user: ArenaUser
  surveyId: number
  cycle: string
  entityDefUuid: string
  chainUuid: string
  filePath: string
}) => {
  const job = new PersistResultsJob({ user, surveyId, cycle, chainUuid, nodeDefUuid: entityDefUuid, filePath })
  return JobManager.enqueueJob(job)
}

export const startPersistOlapDataJob = ({
  user,
  surveyId,
  cycle,
  chainUuid,
  filePath,
}: {
  user: ArenaUser
  surveyId: number
  cycle: string
  chainUuid: string
  filePath: string
}) => {
  const job = new PersistOlapDataJob({ user, surveyId, cycle, chainUuid, filePath })
  return JobManager.enqueueJob(job)
}

const getAnalysisNodeDefZipEntryName = ({
  entity,
  nodeDef,
}: {
  entity: ArenaNodeDefEntity
  nodeDef: ArenaAnyNodeDef
}) => {
  const nodeDefName = NodeDef.getName(nodeDef)

  if (NodeDef.isBaseUnit(nodeDef)) {
    return `base-unit-${nodeDefName}`
  }
  if (NodeDef.isSampling(nodeDef) && !NodeDef.isAreaBasedEstimatedOf(nodeDef)) {
    return nodeDefName.replace(`${NodeDef.getName(entity)}_`, `${NodeDef.getName(entity)}-`)
  }
  return `${NodeDef.getName(entity)}-${nodeDefName}`
}

export const persistUserScripts = async ({
  user,
  surveyId,
  chainUuid,
  filePath,
}: {
  user: ArenaUser
  surveyId: number
  chainUuid: string
  filePath: string
}) => {
  const fileZip = new FileZip(filePath)
  await fileZip.init()

  const entryNames = fileZip.getEntryNames({ onlyFirstLevel: false })

  const findEntry = ({ folderNames = [RChain.dirNames.user, RChain.dirNames.sampling], name }) =>
    entryNames.find((entryName) =>
      folderNames.some((folder) => new RegExp(String.raw`^${folder}\/\d{3}-${name}\.R$`).test(entryName))
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
        fields: { [TableChain.columnSet.scriptCommon]: scriptCommon, [TableChain.columnSet.scriptEnd]: scriptEnd },
      },
      tx
    )

    const [chain, survey] = await Promise.all([
      AnalysisManager.fetchChain({ surveyId, chainUuid, includeScript: true }, tx),
      SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, advanced: true, draft: true }),
    ])

    const entities = Survey.getAnalysisEntities({ chain })(survey)

    for (const entity of entities) {
      const analysisNodeDefsInEntity = Survey.getAnalysisNodeDefs({ entity, chain, hideAreaBasedEstimate: false })(
        survey
      )
      for (const nodeDef of analysisNodeDefsInEntity) {
        const nodeDefUuid = NodeDef.getUuid(nodeDef)
        const parentUuid = NodeDef.getParentUuid(nodeDef)

        const scriptEntryName = getAnalysisNodeDefZipEntryName({ entity, nodeDef })

        const script = getZipEntryAsText(scriptEntryName)

        /* NOSONAR */ await NodeDefManager.updateNodeDefProps(
          { user, survey, nodeDefUuid, parentUuid, propsAdvanced: { script }, markSurveyAsDraft: false },
          tx
        )
      }
    }
  })
  await UserService.notifyActiveUsersAboutSurveyUpdate({ surveyId })
}
