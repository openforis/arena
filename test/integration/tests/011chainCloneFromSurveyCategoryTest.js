import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Category from '@core/survey/category'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ChainRepository from '@server/modules/analysis/repository/chain'
import * as AnalysisManager from '@server/modules/analysis/manager'

import * as SB from '../../utils/surveyBuilder'

import { getContextUser } from '../config/context'

const { nodeDefType } = NodeDef

describe('Clone chain from another survey - category resolution', () => {
  let sourceSurvey
  let targetSurvey
  let sourceChainUuid

  beforeAll(async () => {
    const user = getContextUser()
    sourceChainUuid = uuidv4()

    sourceSurvey = await SB.survey(
      user,
      SB.entity(
        'cluster_src',
        SB.attribute('cluster_id_src', nodeDefType.integer).key(),
        SB.attribute('zone_analysis_src', nodeDefType.code)
          .category('zone_cat_src')
          .analysis()
          .propAdvanced(NodeDef.keysPropsAdvanced.chainUuid, sourceChainUuid)
      )
    )
      .categories(SB.category('zone_cat_src').levels('level1').items(SB.categoryItem('A'), SB.categoryItem('B')))
      .buildAndStore()

    await ChainRepository.insertChain({
      surveyId: Survey.getId(sourceSurvey),
      chain: { uuid: sourceChainUuid, props: { name: 'chain_src' } },
    })

    // Analysis attributes are cloned into the entity with the same name in the target survey.
    targetSurvey = await SB.survey(
      user,
      SB.entity('cluster_src', SB.attribute('cluster_id_tgt', nodeDefType.integer).key())
    ).buildAndStore()
  })

  afterAll(async () => {
    if (sourceSurvey) await SurveyManager.deleteSurvey(Survey.getId(sourceSurvey))
    if (targetSurvey) await SurveyManager.deleteSurvey(Survey.getId(targetSurvey))
  })

  test('Cloning a chain with a code analysis attribute also clones the referenced category', async () => {
    const user = getContextUser()
    const sourceSurveyId = Survey.getId(sourceSurvey)
    const targetSurveyId = Survey.getId(targetSurvey)

    const sourceCategory = Survey.getCategoryByName('zone_cat_src')(sourceSurvey)

    await AnalysisManager.cloneChainFromSurvey({
      user,
      surveyId: targetSurveyId,
      sourceSurveyId,
      sourceChainUuid,
    })

    const targetSurveyRefetched = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
      surveyId: targetSurveyId,
      draft: true,
      advanced: true,
      includeAnalysis: true,
    })

    // The category must have been cloned into the target survey with the same uuid.
    const clonedCategory = Survey.getCategoryByUuid(Category.getUuid(sourceCategory))(targetSurveyRefetched)
    expect(clonedCategory).toBeDefined()
    expect(Category.getName(clonedCategory)).toBe(Category.getName(sourceCategory))

    // The cloned analysis attribute must reference the cloned category.
    const clonedAnalysisAttr = Survey.getNodeDefsArray(targetSurveyRefetched).find(
      (nd) => NodeDef.isAnalysis(nd) && NodeDef.isCode(nd)
    )
    expect(clonedAnalysisAttr).toBeDefined()
    expect(NodeDef.getCategoryUuid(clonedAnalysisAttr)).toBe(Category.getUuid(sourceCategory))
  })
})
