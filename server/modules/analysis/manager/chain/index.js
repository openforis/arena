import * as A from '@core/arena'
import * as DB from '../../../../db'

import * as Chain from '../../../../../common/analysis/processingChain'
import { TableChain } from '../../../../../common/model/db'
import * as ActivityLog from '../../../../../common/activityLog/activityLog'

import { markSurveyDraft } from '../../../survey/repository/surveySchemaRepositoryUtils'
import * as ActivityLogRepository from '../../../activityLog/repository/activityLogRepository'
import * as ChainRepository from '../../repository/chain'
import { ChainNodeDefRepository } from '../../repository/chainNodeDef'

// ====== CREATE
const _insertChain = async ({ user, surveyId, chain }, client) => {
  const chainDb = await ChainRepository.insertChain({ surveyId, chain }, client)
  await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.chainCreate, chainDb, false, client)
}

// ====== READ
export const { countChains, fetchChains } = ChainRepository

/**
 * Fetches a single processing chain by the given survey id and chainUuid.
 *
 * @param {!object} params - The query parameters.
 * @param {!string} params.surveyId - The survey id.
 * @param {!string} params.chainUuid - The processing chain uuid.
 * @param {boolean} [params.includeScript=false] - Whether to include the R scripts.
 * @param {boolean} [params.includeChainNodeDefs=false] - Whether to ChainNodeDefs.
 * @param {BaseProtocol} [client=db] - The database client.
 *
 * @returns {Promise<Chain|null>} - The result promise.
 */
export const fetchChain = async (params, client = DB.client) => {
  const { includeChainNodeDefs = false } = params

  const chain = await ChainRepository.fetchChain(params, client)

  if (includeChainNodeDefs) {
    const chainNodeDefs = await ChainNodeDefRepository.fetchChainNodeDefsByChainUuid(params, client)
    chain[Chain.keys.chainNodeDefs] = chainNodeDefs
  }

  return chain
}

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
      const type = ActivityLog.type.processingChainStatusExecSuccess
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
export const deleteChain = async ({ user, surveyId, chainUuid }, client = DB.client) =>
  client.tx(async (tx) => {
    const chains = await ChainRepository.deleteChain({ surveyId, chainUuid }, tx)
    const content = {
      [ActivityLog.keysContent.uuid]: chainUuid,
      [ActivityLog.keysContent.labels]: Chain.getLabels(chains[0]),
    }
    return tx.batch([
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.processingChainDelete, content, false, tx),
      markSurveyDraft(surveyId, tx),
    ])
  })

export const deleteChainWithoutCycle = async ({ surveyId }, client = DB.client) =>
  ChainRepository.deleteChain({ surveyId, noCycle: true }, client)
