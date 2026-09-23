import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ChainRepository from '@server/modules/analysis/repository/chain'
import * as NodeDefService from '@server/modules/nodeDef/service/nodeDefService'

import * as SB from '../../utils/surveyBuilder'

import { getContextUser } from '../config/context'

const { nodeDefType } = NodeDef

describe('Analysis node defs chain index reindex on delete', () => {
  let survey
  let chainUuid

  beforeAll(async () => {
    const user = getContextUser()
    chainUuid = uuidv4()

    survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_id', nodeDefType.integer).key(),
        SB.attribute('var_0', nodeDefType.decimal)
          .analysis()
          .propAdvanced(NodeDef.keysPropsAdvanced.chainUuid, chainUuid)
          .propAdvanced(NodeDef.keysPropsAdvanced.index, 0)
          .propAdvanced(NodeDef.keysPropsAdvanced.active, true)
          .propAdvanced(NodeDef.keysPropsAdvanced.script, 'var_0 <- 1'),
        SB.attribute('var_1', nodeDefType.decimal)
          .analysis()
          .propAdvanced(NodeDef.keysPropsAdvanced.chainUuid, chainUuid)
          .propAdvanced(NodeDef.keysPropsAdvanced.index, 1)
          .propAdvanced(NodeDef.keysPropsAdvanced.active, true),
        SB.attribute('var_2', nodeDefType.decimal)
          .analysis()
          .propAdvanced(NodeDef.keysPropsAdvanced.chainUuid, chainUuid)
          .propAdvanced(NodeDef.keysPropsAdvanced.index, 2)
          .propAdvanced(NodeDef.keysPropsAdvanced.active, true)
          .propAdvanced(NodeDef.keysPropsAdvanced.script, 'var_2 <- 2'),
        SB.attribute('var_3', nodeDefType.decimal)
          .analysis()
          .propAdvanced(NodeDef.keysPropsAdvanced.chainUuid, chainUuid)
          .propAdvanced(NodeDef.keysPropsAdvanced.index, 3)
          .propAdvanced(NodeDef.keysPropsAdvanced.active, true)
          .propAdvanced(NodeDef.keysPropsAdvanced.aggregateFunctions, { sum: true })
      )
    ).buildAndStore()

    await ChainRepository.insertChain({
      surveyId: Survey.getId(survey),
      chain: { uuid: chainUuid, props: { name: 'chain_reindex_test' } },
    })
  })

  afterAll(async () => {
    if (survey) await SurveyManager.deleteSurvey(Survey.getId(survey))
  })

  test('deleting an analysis node def recompacts siblings chain index and preserves their other props', async () => {
    const surveyId = Survey.getId(survey)
    const var1Uuid = NodeDef.getUuid(Survey.findNodeDefByName('var_1')(survey))

    await NodeDefService.markNodeDefDeleted({
      user: getContextUser(),
      surveyId,
      cycle: Survey.cycleOneKey,
      nodeDefUuid: var1Uuid,
    })

    const surveyRefetched = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
      surveyId,
      cycle: Survey.cycleOneKey,
      draft: true,
      advanced: true,
    })

    const remainingAnalysisNodeDefs = Survey.getAnalysisNodeDefs({
      chain: { uuid: chainUuid },
      showSamplingNodeDefs: false,
      showInactiveResultVariables: true,
    })(surveyRefetched)

    // chain indices are contiguous, with no gap left by the deleted node def
    expect(remainingAnalysisNodeDefs.map(NodeDef.getName)).toEqual(['var_0', 'var_2', 'var_3'])
    expect(remainingAnalysisNodeDefs.map(NodeDef.getChainIndex)).toEqual([0, 1, 2])

    // other props/propsAdvanced of the reindexed siblings are untouched
    const var0 = Survey.findNodeDefByName('var_0')(surveyRefetched)
    const var2 = Survey.findNodeDefByName('var_2')(surveyRefetched)
    const var3 = Survey.findNodeDefByName('var_3')(surveyRefetched)

    expect(NodeDef.getChainUuid(var0)).toBe(chainUuid)
    expect(NodeDef.isActive(var0)).toBe(true)
    expect(NodeDef.getScript(var0)).toBe('var_0 <- 1')

    expect(NodeDef.getChainUuid(var2)).toBe(chainUuid)
    expect(NodeDef.isActive(var2)).toBe(true)
    expect(NodeDef.getScript(var2)).toBe('var_2 <- 2')

    expect(NodeDef.getChainUuid(var3)).toBe(chainUuid)
    expect(NodeDef.isActive(var3)).toBe(true)
    expect(NodeDef.getAggregateFunctions(var3)).toEqual({ sum: true })
  })
})
