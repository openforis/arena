import { MockLanguageModelV4 } from 'ai/test'
import { z } from 'zod'

import SystemError from '@core/systemError'

import * as ModelClient from '@server/modules/ai/service/modelClient'
import { createServerTextGenerator } from '@server/modules/ai/service/serverTextGenerator'
import { assertSurveyAiAllowed } from '@server/modules/ai/service/surveyAiPolicyService'

import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

const user: any = {
  uuid: 'user-1',
  prefs: { ai: { featuresEnabled: true, featureToggles: { translation: true, dataDictionary: true } } },
}
const gateEnv = { aiFeaturesEnabled: true, aiFeatureFlags: null }

const textModel = (text: string) =>
  new MockLanguageModelV4({
    doGenerate: async () =>
      ({
        content: [{ type: 'text', text }],
        finishReason: { unified: 'stop', raw: undefined },
        usage: { inputTokens: { total: 1 }, outputTokens: { total: 1 } },
        warnings: [],
      }) as any,
  })

const createDeps = ({ model, refuse = false }: { model: any; refuse?: boolean }) => {
  const checks: any[] = []
  const deps = {
    resolveModel: async () => ({ model, meta: { source: 'admin-default', provider: 'mock', model: 'mock', hostingClass: 'cloud' } }),
    assertPolicyAllows: async (check: any) => {
      checks.push(check)
      if (refuse) throw new SystemError('aiPolicyRefused', { dataClass: check.dataClass }, 403)
    },
    gateEnv,
  }
  return { deps, checks }
}

describe('ModelClient and the survey AI policy', () => {
  test('refuses before generateText when the policy forbids schema', async () => {
    const model = textModel('hello')
    const { deps, checks } = createDeps({ model, refuse: true })
    await expectSystemErrorKey(
      ModelClient.generate({ user, feature: 'translation', surveyId: 4, prompt: 'p' }, deps),
      'aiPolicyRefused'
    )
    expect(checks).toEqual([{ surveyId: 4, dataClass: 'schema', hostingClass: 'cloud' }])
    expect(model.doGenerateCalls).toHaveLength(0)
  })

  test('an allowed call returns the text', async () => {
    const { deps } = createDeps({ model: textModel('hello') })
    const result = await ModelClient.generate({ user, feature: 'dataDictionary', surveyId: 4, prompt: 'p' }, deps)
    expect(result.text).toBe('hello')
  })

  test('generateStructured is checked too', async () => {
    const model = textModel('{"ok":true}')
    const { deps, checks } = createDeps({ model, refuse: true })
    await expectSystemErrorKey(
      ModelClient.generateStructured(
        { user, feature: 'internalPing', surveyId: null, prompt: 'p', schema: z.object({ ok: z.boolean() }) },
        deps
      ),
      'aiPolicyRefused'
    )
    // no survey: the enforcer checks the ceilings only
    expect(checks).toEqual([{ surveyId: null, dataClass: 'schema', hostingClass: 'cloud' }])
    expect(model.doGenerateCalls).toHaveLength(0)
  })

  test('a caller that does not pass surveyId fails loudly', async () => {
    const { deps } = createDeps({ model: textModel('x') })
    await expect(ModelClient.generate({ user, feature: 'translation', prompt: 'p' } as any, deps)).rejects.toThrow(
      'surveyId is required'
    )
  })
})

describe('createServerTextGenerator', () => {
  test('passes the survey to ModelClient.generate', async () => {
    const calls: any[] = []
    const generateText = createServerTextGenerator(
      { user, feature: 'translation', surveyId: 9 },
      {
        generate: async (args: any) => {
          calls.push(args)
          return { text: 'done' } as any
        },
      }
    )
    expect(await generateText({ system: 's', prompt: 'p' })).toBe('done')
    expect(calls[0]).toMatchObject({ user, feature: 'translation', surveyId: 9, system: 's', prompt: 'p' })
  })
})

describe('assertSurveyAiAllowed (job pre-start check)', () => {
  const createCheckDeps = (resolved: any) => {
    const checks: any[] = []
    return {
      checks,
      deps: {
        resolveConfigForUser: () => resolved,
        assertPolicyAllows: async (check: any) => {
          checks.push(check)
        },
        allowlist: ['http://llm.org.internal/v1'],
      },
    }
  }

  test('no provider → aiNotConfigured (503)', async () => {
    const { deps } = createCheckDeps(null)
    const error: any = await expectSystemErrorKey(assertSurveyAiAllowed({ user, surveyId: 9, dataClass: 'schema' }, deps), 'aiNotConfigured')
    expect(error.statusCode).toBe(503)
  })

  test('checks the policy with the hosting class of the resolved config, without building the model', async () => {
    const { deps, checks } = createCheckDeps({
      cfg: { provider: 'openai-compatible', model: 'm', baseUrl: 'http://llm.org.internal/v1' },
      source: 'user',
    })
    await assertSurveyAiAllowed({ user, surveyId: '9' as any, dataClass: 'schema' }, deps)
    expect(checks).toEqual([{ surveyId: 9, dataClass: 'schema', hostingClass: 'orgHosted' }])
  })
})
