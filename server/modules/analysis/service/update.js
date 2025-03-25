import { DB } from '@openforis/arena-server'

import * as Survey from '@core/survey/survey'
import * as Chain from '@common/analysis/chain'
import * as ChainValidator from '@common/analysis/chainValidator'
import * as ActivityLog from '@common/activityLog/activityLog'
import { TableChain } from '@common/model/db'

import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as ChainRepository from '@server/modules/analysis/repository/chain'
import * as ChainManager from '@server/modules/analysis/manager/chain'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import { markSurveyDraft } from '@server/modules/survey/repository/surveySchemaRepositoryUtils'

export const validate = async ({ surveyId, chainUuid, chain: chainParam = null }, client = DB) => {
  const chain = chainParam ?? (await ChainManager.fetchChain({ surveyId, chainUuid }, client))
  const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, draft: true, advanced: true }, client)
  const defaultLang = Survey.getDefaultLanguage(Survey.getSurveyInfo(survey))
  const validation = await ChainValidator.validateChain({ chain, defaultLang, survey })
  await ChainManager.updateChainValidation({ surveyId, chainUuid: chain.uuid, validation }, client)
  return Chain.assocValidation(validation)(chain)
}

export const update = async ({ user, surveyId, chain }) => {
  const chainUuid = Chain.getUuid(chain)

  return DB.tx(async (t) => {
    const chainDb = await ChainRepository.fetchChain({ surveyId, chainUuid }, t)
    const propsToUpdate = Chain.getPropsDiff(chain)(chainDb)

    // activity log for each updated prop
    const updates = Object.entries(propsToUpdate).map(([key, value]) => {
      const content = { [ActivityLog.keysContent.uuid]: chainUuid, key, value }
      const type = ActivityLog.type.chainPropUpdate
      return ActivityLogRepository.insert(user, surveyId, type, content, false, t)
    })

    const chainWithValidation = await validate({ surveyId, chainUuid, chain }, t)

    // chain props
    const fields = { [TableChain.columnSet.props]: propsToUpdate }
    const params = { surveyId, chainUuid, dateModified: true, fields }
    updates.push(ChainRepository.updateChain(params, t))

    if (Chain.checkChangeRequiresSurveyPublish({ chainPrev: chainDb, chainNext: chainWithValidation })) {
      // mark survey draft
      updates.push(markSurveyDraft(surveyId, t))
    }

    await t.batch(updates)

    return chainWithValidation
  })
}
