import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Chain from '@common/analysis/chain'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as ChainRepository from '@server/modules/analysis/repository/chain'
import * as AnalysisManager from '@server/modules/analysis/manager'

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

    // Published template with one chain.
    templateSurvey = await SB.survey(
      user,
      SB.entity('cluster_tpl', SB.attribute('cluster_id_tpl', nodeDefType.integer).key())
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
})
