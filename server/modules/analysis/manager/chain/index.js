import * as A from '@core/arena'
import * as Chain from '@common/analysis/chain'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefService from '@server/modules/nodeDef/service/nodeDefService'

import * as DB from '../../../../db'

import { TableChain } from '../../../../../common/model/db'
import * as ActivityLog from '../../../../../common/activityLog/activityLog'

import { markSurveyDraft } from '../../../survey/repository/surveySchemaRepositoryUtils'
import * as ActivityLogRepository from '../../../activityLog/repository/activityLogRepository'
import * as ChainRepository from '../../repository/chain'

// ====== CREATE
const _insertChain = async ({ user, surveyId, chain }, client) => {
  const chainDb = await ChainRepository.insertChain({ surveyId, chain }, client)
  await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.chainCreate, chainDb, false, client)
}

// ====== READ
export const { countChains, fetchChains, fetchChain } = ChainRepository

// ====== UPDATE
export const { updateChain, removeChainCycles } = ChainRepository

export const updateChainStatusExec = async ({ user, surveyId, chainUuid, statusExec }) =>
  DB.client.tx(async (tx) => {
    const promises = [
      ChainRepository.updateChain(
        { surveyId, chainUuid, fields: { [TableChain.columnSet.statusExec]: statusExec }, dateExecuted: true },
        tx
      ),
    ]
    if (statusExec === Chain.statusExec.success) {
      const type = ActivityLog.type.chainStatusExecSuccess
      const content = { [ActivityLog.keysContent.uuid]: chainUuid }
      promises.push(ActivityLogRepository.insert(user, surveyId, type, content, false, tx))
    }

    return Promise.all(promises)
  })

const _updateChain = async ({ user, surveyId, chain, chainDb }, client) => {
  const chainUuid = Chain.getUuid(chain)
  const propsToUpdate = Chain.getPropsDiff(chain)(chainDb)
  // activity log for each updated prop
  const promises = Object.entries(propsToUpdate).map(([key, value]) => {
    const content = { [ActivityLog.keysContent.uuid]: chainUuid, key, value }
    const type = ActivityLog.type.chainPropUpdate
    return ActivityLogRepository.insert(user, surveyId, type, content, false, client)
  })
  // chain props and validation update
  const fields = {
    [TableChain.columnSet.props]: propsToUpdate,
    [TableChain.columnSet.validation]: Chain.getValidation(chain),
  }
  const params = { surveyId, chainUuid, dateModified: true, fields }
  promises.push(ChainRepository.updateChain(params, client))

  return Promise.all(promises)
}

// ====== PERSIST
/* eslint-disable */
/**
 * @deprecated
 */
export const persistChain = async ({ user, surveyId, chain }, client) => {
  const chainDb = await ChainRepository.fetchChain({ surveyId, chainUuid: Chain.getUuid(chain) }, client)
  return !A.isEmpty(chainDb)
    ? _updateChain({ user, surveyId, chain, chainDb }, client)
    : _insertChain({ user, surveyId, chain }, client)
}

// ====== DELETE

export const _deleteChain = async ({ user, surveyId, chainUuid = false, noCycle = false }, client = DB.client) => {
  const chains = await ChainRepository.deleteChain({ surveyId, chainUuid, noCycle }, client)

  const chainsUuids = chains.map(Chain.getUuid)
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
    { surveyId, draft: true, advanced: true },
    (client = DB.client)
  )

  const nodeDefsUuidsInDeleteChains = Survey.getNodeDefsArray(survey)
    .filter((_nodeDef) => chainsUuids.includes(NodeDef.getChainUuid(_nodeDef)))
    .map(NodeDef.getUuid)

  await NodeDefService.markNodeDefsDeleted({ user, surveyId, nodeDefUuids: nodeDefsUuidsInDeleteChains }, client)

  return chains
}

export const cleanChainsOrphans = async ({ user, surveyId }, client = DB.client) =>
  client.tx(async (tx) => {
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true }, tx)
    const chains = await ChainRepository.fetchChains({ surveyId }, tx)
    const chainsUuids = chains.map(Chain.getUuid)

    const orphanNodeDefsUuids = Survey.getNodeDefsArray(survey)
      .filter((_nodeDef) => NodeDef.getChainUuid(_nodeDef) && !chainsUuids.includes(NodeDef.getChainUuid(_nodeDef)))
      .map(NodeDef.getUuid)
    console.log('orphanNodeDefsUuids', orphanNodeDefsUuids)

    return NodeDefService.markNodeDefsDeleted({ user, surveyId, nodeDefUuids: orphanNodeDefsUuids }, client)
  })

export const cleanChains = async ({ user, surveyId }, client = DB.client) =>
  client.tx(async (tx) => {
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true }, tx)
    const chains = await ChainRepository.fetchChains({ surveyId }, tx)
    const chainsUuids = chains.map(Chain.getUuid)

    const orphanNodeDefsUuids = []

    Survey.getNodeDefsArray(survey)
      .forEach((nodeDef) => {
        if (NodeDef.getChainUuid(nodeDef)) {
          if (!chainsUuids.includes(NodeDef.getChainUuid(nodeDef))) {
            orphanNodeDefsUuids.push(NodeDef.getUuid(nodeDef))
          } else {
            const areaBasedEstimatedOf = Survey.getAreaBasedEstimatedOfNodeDef(nodeDef)(survey)
            if (areaBasedEstimatedOf) {

            }
          }
        }
      })
    console.log('orphanNodeDefsUuids', orphanNodeDefsUuids)

    const { nodeDefsUpdated, nodeDefsValidation } = await NodeDefService.markNodeDefsDeleted(
      { user, surveyId, nodeDefUuids: orphanNodeDefsUuids },
      client
    )
    return { nodeDefsUpdated, nodeDefsValidation }
  })

export const deleteChain = async ({ user, surveyId, chainUuid }, client = DB.client) =>
  client.tx(async (tx) => {
    const chains = await _deleteChain({ user, surveyId, chainUuid }, tx)

    const content = {
      [ActivityLog.keysContent.uuid]: chainUuid,
      [ActivityLog.keysContent.labels]: Chain.getLabels(chains[0]),
    }
    return tx.batch([
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.chainDelete, content, false, tx),
      markSurveyDraft(surveyId, tx),
    ])
  })

export const deleteChainWithoutCycle = async ({ surveyId }, client = DB.client) =>
  client.tx(async (tx) => _deleteChain({ surveyId, noCycle: true }, tx))
