import { ChainFactory } from '@openforis/arena-core'

import * as R from 'ramda'

import * as A from '@core/arena'
import * as Chain from '@common/analysis/chain'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { UniqueNameGenerator } from '@core/uniqueNameGenerator'
import { uuidv4 } from '@core/uuid'
import SystemError from '@core/systemError'

import { TableChain } from '@common/model/db'
import * as ActivityLog from '@common/activityLog/activityLog'
import * as ChainValidator from '@common/analysis/chainValidator'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefService from '@server/modules/nodeDef/service/nodeDefService'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import { markSurveyDraft } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'
import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'

import * as DB from '@server/db'

import * as ChainRepository from '../../repository/chain'

// ====== CREATE

export const insertChain = async ({ user, surveyId, chain }, client = DB.client) =>
  client.tx(async (t) => {
    const chainDb = await ChainRepository.insertChain({ surveyId, chain }, t)
    await ActivityLogRepository.insert(user, surveyId, ActivityLog.type.chainCreate, chainDb, false, t)
    await markSurveyDraft(surveyId, t)
    return chainDb
  })

export const create = async ({ user, surveyId }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true })
  const surveyInfo = Survey.getSurveyInfo(survey)
  const cycles = Survey.getCycleKeys(surveyInfo)
  const defaultLang = Survey.getDefaultLanguage(surveyInfo)

  let chain = ChainFactory.createInstance({ cycles })

  const validation = await ChainValidator.validateChain({ chain, defaultLang, survey })

  chain = Chain.assocValidation(validation)(chain)

  return insertChain({ surveyId, user, chain })
}

// ====== READ
export const { countChains, fetchChains, fetchChain } = ChainRepository

// ====== UPDATE
export const { updateChain } = ChainRepository

export const updateChainValidation = async ({ surveyId, chainUuid, validation }, client = DB.client) =>
  ChainRepository.updateChain(
    { surveyId, chainUuid, fields: { [TableChain.columnSet.validation]: validation } },
    client
  )

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
    : insertChain({ user, surveyId, chain }, client)
}

// ====== DELETE

export const _deleteChain = async ({ user, surveyId, chainUuid }, client = DB.client) => {
  const deletedChain = await ChainRepository.deleteChain({ surveyId, chainUuid }, client)
  const deletedChainUuid = Chain.getUuid(deletedChain)
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
    { surveyId, draft: true, advanced: true, includeAnalysis: true },
    (client = DB.client)
  )

  const nodeDefsUuidsInDeleteChains = Survey.getNodeDefsArray(survey)
    .filter((_nodeDef) => deletedChainUuid === NodeDef.getChainUuid(_nodeDef))
    .map(NodeDef.getUuid)

  await NodeDefService.markNodeDefsDeleted({ user, surveyId, nodeDefUuids: nodeDefsUuidsInDeleteChains }, client)

  return deletedChain
}

export const deleteChain = async ({ user, surveyId, chainUuid }, client = DB.client) =>
  client.tx(async (tx) => {
    const deletedChain = await _deleteChain({ user, surveyId, chainUuid }, tx)

    const content = {
      [ActivityLog.keysContent.uuid]: chainUuid,
      [ActivityLog.keysContent.labels]: Chain.getLabels(deletedChain),
    }
    return tx.batch([
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.chainDelete, content, false, tx),
      markSurveyDraft(surveyId, tx),
    ])
  })

// ====== CLONE FROM SURVEY

export const cloneChainFromSurvey = async (
  { user, surveyId, sourceSurveyId, sourceChainUuid },
  client = DB.client
) =>
  client.tx(async (tx) => {
    const fetchSurveyFull = (sid) =>
      SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
        { surveyId: sid, draft: true, advanced: true, includeAnalysis: true },
        tx
      )

    const [sourceSurvey, targetSurvey] = await Promise.all([fetchSurveyFull(sourceSurveyId), fetchSurveyFull(surveyId)])

    const sourceChain = await ChainRepository.fetchChain(
      { surveyId: sourceSurveyId, chainUuid: sourceChainUuid, includeScript: true },
      tx
    )

    const sourceAnalysisNodeDefs = Survey.getNodeDefsArray(sourceSurvey).filter(
      (nd) => NodeDef.isAnalysis(nd) && NodeDef.getChainUuid(nd) === sourceChainUuid
    )

    // Build map of entity name → nodeDef for the target survey.
    const targetEntityByName = {}
    Survey.getNodeDefsArray(targetSurvey)
      .filter(NodeDef.isEntity)
      .forEach((nd) => {
        targetEntityByName[NodeDef.getName(nd)] = nd
      })

    // Validate: every entity that holds a source analysis attribute must exist in target survey by name.
    const missingEntityNames = []
    sourceAnalysisNodeDefs.forEach((nd) => {
      const parentEntity = Survey.getNodeDefByUuid(NodeDef.getParentUuid(nd))(sourceSurvey)
      const parentName = NodeDef.getName(parentEntity)
      if (!targetEntityByName[parentName] && !missingEntityNames.includes(parentName)) {
        missingEntityNames.push(parentName)
      }
    })
    if (missingEntityNames.length > 0) {
      throw new SystemError('chainView.cloneFromAnotherSurveyDialog.missingEntities', {
        entities: missingEntityNames.join(', '),
      })
    }

    // Create new chain with a new UUID, copying props and scripts from source.
    const newChain = { [Chain.keys.uuid]: uuidv4(), [Chain.keys.props]: Chain.getProps(sourceChain) }
    const insertedChain = await ChainRepository.insertChainFull({
      surveyId,
      chain: newChain,
      scriptCommon: Chain.getScriptCommon(sourceChain),
      scriptEnd: Chain.getScriptEnd(sourceChain),
    }, tx)

    const newChainUuid = Chain.getUuid(insertedChain)

    // Clone analysis node defs, remapping parent entity to target survey and updating chainUuid.
    const usedNames = new Set(Survey.getNodeDefsArray(targetSurvey).map(NodeDef.getName))
    const clonedNodeDefs = sourceAnalysisNodeDefs.map((nd) => {
      const sourceParentName = NodeDef.getName(Survey.getNodeDefByUuid(NodeDef.getParentUuid(nd))(sourceSurvey))
      const targetParentEntity = targetEntityByName[sourceParentName]
      const uniqueName = UniqueNameGenerator.generateUniqueName({
        startingName: NodeDef.getName(nd),
        existingNames: usedNames,
      })
      usedNames.add(uniqueName)
      const cloned = NodeDef.cloneIntoEntityDef({
        nodeDefParent: targetParentEntity,
        clonedNodeDefName: uniqueName,
        ignoreDefaultValues: false,
        ignoreApplicability: false,
        ignoreValidations: false,
      })(nd)
      return R.assocPath([NodeDef.keys.propsAdvanced, NodeDef.keysPropsAdvanced.chainUuid], newChainUuid)(cloned)
    })

    if (clonedNodeDefs.length > 0) {
      await NodeDefManager.insertNodeDefsBatch({ surveyId, nodeDefs: clonedNodeDefs }, tx)
    }

    await tx.batch([
      ActivityLogRepository.insert(user, surveyId, ActivityLog.type.chainCreate, insertedChain, false, tx),
      markSurveyDraft(surveyId, tx),
    ])

    return insertedChain
  })
