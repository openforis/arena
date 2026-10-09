import {
  addAiPolicyToExportedSurvey,
  writeImportedSurveyAiPolicy,
} from '@server/modules/ai/service/surveyAiPolicyService'

const createDeps = (ceilings: any = { schema: 'cloud', data: 'cloud' }) => {
  const stored: any[] = []
  return {
    stored,
    deps: {
      storePolicy: async ({ surveyId, policy }: any) => {
        stored.push({ surveyId, policy })
      },
      getCeilings: () => ceilings,
    },
  }
}

describe('addAiPolicyToExportedSurvey', () => {
  // survey.json is the survey info itself, with the node defs etc. associated to it
  const survey = { uuid: 's-1', props: { name: 'x' }, nodeDefs: {} }

  test('writes the raw policy into the exported survey info', () => {
    const exported: any = addAiPolicyToExportedSurvey({ survey, rawPolicy: { schema: 'off', data: 'cloud' } })
    expect(exported.aiPolicy).toEqual({ schema: 'off', data: 'cloud' })
    expect(exported.props).toEqual({ name: 'x' })
    expect(exported.nodeDefs).toBe(survey.nodeDefs)
    expect((survey as any).aiPolicy).toBeUndefined()
  })

  test('a survey nesting its info in `info` gets the policy there', () => {
    const nested = { info: { uuid: 's-1', props: {} }, nodeDefs: {} }
    const exported: any = addAiPolicyToExportedSurvey({ survey: nested, rawPolicy: { schema: 'off', data: 'off' } })
    expect(exported.info.aiPolicy).toEqual({ schema: 'off', data: 'off' })
    expect(exported.aiPolicy).toBeUndefined()
  })

  test('a survey without a policy is exported unchanged', () => {
    expect(addAiPolicyToExportedSurvey({ survey, rawPolicy: null })).toBe(survey)
  })
})

describe('writeImportedSurveyAiPolicy', () => {
  test('the policy is carried over', async () => {
    const { deps, stored } = createDeps()
    const policy = await writeImportedSurveyAiPolicy(
      { surveyId: 21, surveyInfo: { aiPolicy: { schema: 'off', data: 'cloud' } } },
      deps
    )
    expect(policy).toEqual({ schema: 'off', data: 'cloud' })
    expect(stored).toEqual([{ surveyId: 21, policy: { schema: 'off', data: 'cloud' } }])
  })

  test('clamps to the ceilings of this instance', async () => {
    const { deps, stored } = createDeps({ schema: 'orgHosted', data: 'onDevice' })
    await writeImportedSurveyAiPolicy(
      { surveyId: 21, surveyInfo: { aiPolicy: { schema: 'cloud', data: 'cloud' } } },
      deps
    )
    expect(stored[0].policy).toEqual({ schema: 'orgHosted', data: 'onDevice' })
  })

  test('a corrupt class fails closed', async () => {
    const { deps, stored } = createDeps()
    await writeImportedSurveyAiPolicy({ surveyId: 21, surveyInfo: { aiPolicy: { schema: 'everywhere' } } }, deps)
    expect(stored[0].policy).toEqual({ schema: 'off', data: 'onDevice' })
  })

  test('an absent policy gives the defaults (nothing stored)', async () => {
    const { deps, stored } = createDeps()
    expect(await writeImportedSurveyAiPolicy({ surveyId: 21, surveyInfo: { props: {} } }, deps)).toBeNull()
    expect(stored).toEqual([])
  })
})
