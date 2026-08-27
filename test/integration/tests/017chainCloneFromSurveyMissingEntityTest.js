import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ChainRepository from '@server/modules/analysis/repository/chain'
import * as AnalysisManager from '@server/modules/analysis/manager'

import * as SB from '../../utils/surveyBuilder'

import { getContextUser } from '../config/context'

const { nodeDefType } = NodeDef

describe('Clone chain from another survey - missing entities', () => {
  let sourceSurvey
  let targetSurvey
  let sourceChainUuid

  beforeAll(async () => {
    const user = getContextUser()
    sourceChainUuid = uuidv4()

    // Source survey: root entity "cluster_src" (exists in target) with an analysis attribute,
    // plus a nested multiple entity "plot_src" (missing in target) with its own analysis attribute.
    sourceSurvey = await SB.survey(
      user,
      SB.entity(
        'cluster_src',
        SB.attribute('cluster_id_src', nodeDefType.integer).key(),
        SB.attribute('volume_analysis_src', nodeDefType.decimal)
          .analysis()
          .propAdvanced(NodeDef.keysPropsAdvanced.chainUuid, sourceChainUuid),
        SB.entity(
          'plot_src',
          SB.attribute('plot_id_src', nodeDefType.integer).key(),
          SB.attribute('biomass_analysis_src', nodeDefType.decimal)
            .analysis()
            .propAdvanced(NodeDef.keysPropsAdvanced.chainUuid, sourceChainUuid)
        ).multiple()
      )
    ).buildAndStore()

    await ChainRepository.insertChain({
      surveyId: Survey.getId(sourceSurvey),
      chain: { uuid: sourceChainUuid, props: { name: 'chain_missing_entity_src' } },
    })

    // Target survey only has "cluster_src" - "plot_src" does not exist here.
    targetSurvey = await SB.survey(
      user,
      SB.entity('cluster_src', SB.attribute('cluster_id_tgt', nodeDefType.integer).key())
    ).buildAndStore()
  })

  afterAll(async () => {
    if (sourceSurvey) await SurveyManager.deleteSurvey(Survey.getId(sourceSurvey))
    if (targetSurvey) await SurveyManager.deleteSurvey(Survey.getId(targetSurvey))
  })

  test('Cloning without the skip flag throws when an entity is missing in the target survey', async () => {
    const user = getContextUser()
    const sourceSurveyId = Survey.getId(sourceSurvey)
    const targetSurveyId = Survey.getId(targetSurvey)

    await expect(
      AnalysisManager.cloneChainFromSurvey({
        user,
        surveyId: targetSurveyId,
        sourceSurveyId,
        sourceChainUuid,
      })
    ).rejects.toThrow('chainView.cloneFromAnotherSurveyDialog.missingEntities')
  })

  test('Cloning with skipMissingEntityAttributes clones only attributes whose entity exists in the target survey', async () => {
    const user = getContextUser()
    const sourceSurveyId = Survey.getId(sourceSurvey)
    const targetSurveyId = Survey.getId(targetSurvey)

    await AnalysisManager.cloneChainFromSurvey({
      user,
      surveyId: targetSurveyId,
      sourceSurveyId,
      sourceChainUuid,
      skipMissingEntityAttributes: true,
    })

    const targetSurveyRefetched = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
      surveyId: targetSurveyId,
      draft: true,
      advanced: true,
      includeAnalysis: true,
    })

    const clonedAttrs = Survey.getNodeDefsArray(targetSurveyRefetched).filter(NodeDef.isAnalysis)
    const clonedNames = clonedAttrs.map(NodeDef.getName)

    // The attribute belonging to "cluster_src" (exists in target) was cloned.
    expect(clonedNames).toContain('volume_analysis_src')
    // The attribute belonging to "plot_src" (missing in target) was skipped.
    expect(clonedNames).not.toContain('biomass_analysis_src')
    // "plot_src" itself was not created in the target survey.
    expect(Survey.findNodeDefByName('plot_src')(targetSurveyRefetched)).toBeUndefined()
  })
})
