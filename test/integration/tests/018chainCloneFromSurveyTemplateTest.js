import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as User from '@core/user/user'
import * as Chain from '@common/analysis/chain'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ChainRepository from '@server/modules/analysis/repository/chain'
import * as AnalysisManager from '@server/modules/analysis/manager'
import * as UserRepository from '@server/modules/user/repository/userRepository'

import UnauthorizedError from '@server/utils/unauthorizedError'

import * as SB from '../../utils/surveyBuilder'

import { getContextUser } from '../config/context'

const { nodeDefType } = NodeDef

describe('Clone chain from another survey - templates', () => {
  let templateSurvey
  let regularSurvey
  let chainUuid
  const outsiderUser = { authGroups: [] }

  beforeAll(async () => {
    const user = getContextUser()
    chainUuid = uuidv4()

    // Published template with one chain and one analysis attribute on its root entity.
    templateSurvey = await SB.survey(
      user,
      SB.entity(
        'cluster_tpl',
        SB.attribute('cluster_id_tpl', nodeDefType.integer).key(),
        SB.attribute('volume_analysis_tpl', nodeDefType.decimal)
          .analysis()
          .propAdvanced(NodeDef.keysPropsAdvanced.chainUuid, chainUuid)
      )
    )
      .template()
      .buildAndStore()

    await ChainRepository.insertChain({
      surveyId: Survey.getId(templateSurvey),
      chain: { uuid: chainUuid, props: { name: 'chain_template_src' } },
    })

    // Regular (non-template) published survey the outsider user also has no access to.
    regularSurvey = await SB.survey(
      user,
      SB.entity('cluster_reg', SB.attribute('cluster_id_reg', nodeDefType.integer).key())
    ).buildAndStore()
  })

  afterAll(async () => {
    if (templateSurvey) await SurveyManager.deleteSurvey(Survey.getId(templateSurvey))
    if (regularSurvey) await SurveyManager.deleteSurvey(Survey.getId(regularSurvey))
  })

  test('a user with no auth group can list chains of a published template', async () => {
    const sourceSurveyId = Survey.getId(templateSurvey)

    const list = await AnalysisManager.fetchChainsForCloneFromSurvey({ user: outsiderUser, sourceSurveyId })

    expect(list.map(Chain.getUuid)).toContain(chainUuid)
  })

  test('a user with no auth group cannot list chains of a regular (non-template) survey', async () => {
    const sourceSurveyId = Survey.getId(regularSurvey)

    await expect(AnalysisManager.fetchChainsForCloneFromSurvey({ user: outsiderUser, sourceSurveyId })).rejects.toThrow(
      UnauthorizedError
    )
  })

  test('the admin context user can list chains of the template too', async () => {
    const user = getContextUser()
    const sourceSurveyId = Survey.getId(templateSurvey)

    const list = await AnalysisManager.fetchChainsForCloneFromSurvey({ user, sourceSurveyId })

    expect(list.map(Chain.getUuid)).toContain(chainUuid)
  })

  test('a user with no auth group can fetch the analysis entity names of a published template chain', async () => {
    const sourceSurveyId = Survey.getId(templateSurvey)

    const entityNames = await AnalysisManager.fetchChainSourceEntityNames({
      user: outsiderUser,
      sourceSurveyId,
      sourceChainUuid: chainUuid,
    })

    expect(entityNames).toEqual(['cluster_tpl'])
  })

  test('a user with no auth group cannot fetch entity names of a regular (non-template) survey chain', async () => {
    const sourceSurveyId = Survey.getId(regularSurvey)

    await expect(
      AnalysisManager.fetchChainSourceEntityNames({
        user: outsiderUser,
        sourceSurveyId,
        sourceChainUuid: chainUuid,
      })
    ).rejects.toThrow(UnauthorizedError)
  })

  test('a user with no auth group can successfully clone a chain from a published template', async () => {
    const adminUser = getContextUser()
    const sourceSurveyId = Survey.getId(templateSurvey)

    // A real, persisted user with no auth group on any survey. Unlike the plain `outsiderUser`
    // object literal used by the read-only checks above, this test performs an actual clone,
    // which writes an activity log entry referencing the acting user via a foreign key, so a
    // user that only exists in memory (with no row in the "user" table) would fail on insert.
    const outsiderRealUser = await UserRepository.insertUser({
      email: `chain_clone_outsider_${uuidv4()}@openforis.org`,
      password: 'test_password',
      status: User.userStatus.ACCEPTED,
      name: 'Chain Clone Outsider',
    })

    // Target survey the outsider clones the chain into; the outsider needs no permission on it
    // for this test, which is only exercising the source-side authorization check.
    const targetSurvey = await SB.survey(
      adminUser,
      SB.entity('cluster_tpl', SB.attribute('cluster_id_tpl', nodeDefType.integer).key())
    ).buildAndStore()

    try {
      const targetSurveyId = Survey.getId(targetSurvey)

      const clonedChain = await AnalysisManager.cloneChainFromSurvey({
        user: outsiderRealUser,
        surveyId: targetSurveyId,
        sourceSurveyId,
        sourceChainUuid: chainUuid,
      })

      expect(clonedChain).toBeDefined()
      expect(Chain.getUuid(clonedChain)).not.toBe(chainUuid)
    } finally {
      await SurveyManager.deleteSurvey(Survey.getId(targetSurvey))
      await UserRepository.deleteUser(User.getUuid(outsiderRealUser))
    }
  })

  test('a user with no auth group cannot clone a chain from a draft (unpublished) template', async () => {
    const user = getContextUser()
    const draftTemplateSurvey = await SB.survey(
      user,
      SB.entity('cluster_draft_tpl', SB.attribute('cluster_id_draft_tpl', nodeDefType.integer).key())
    )
      .template()
      .buildAndStore(false)

    try {
      const sourceSurveyId = Survey.getId(draftTemplateSurvey)

      await expect(
        AnalysisManager.fetchChainsForCloneFromSurvey({ user: outsiderUser, sourceSurveyId })
      ).rejects.toThrow(UnauthorizedError)
    } finally {
      await SurveyManager.deleteSurvey(Survey.getId(draftTemplateSurvey))
    }
  })
})
