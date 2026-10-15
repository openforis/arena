import { createDefaultModelClientDeps, generateStructured } from '@server/modules/ai/service/modelClient'

import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

// a user whose own default is an account provider: the server's calls must still ask for Arena default
const user: any = {
  uuid: 'u325',
  prefs: {
    ai: {
      defaultProviderId: 'acct:own',
      providers: [
        { id: 'acct:own', type: 'openai', name: 'Work', model: 'gpt-x', baseUrl: null, apiKeyEncrypted: null },
      ],
    },
  },
}

describe('the default dependencies of the model client ask for Arena default (325)', () => {
  test('resolving the model names Arena default, so it is not refused for a missing provider id', async () => {
    // the test environment has no instance default: aiNotConfigured, not aiCallInvalid (no providerId)
    await expectSystemErrorKey(
      () => createDefaultModelClientDeps().resolveModel({ user, feature: 'internalPing' }),
      'aiNotConfigured'
    )
  })

  test('generateStructured still takes injected dependencies', async () => {
    const resolveModel = jest.fn(async () => {
      throw new Error('stop after resolving')
    })
    const deps = { ...createDefaultModelClientDeps(), resolveModel, gateEnv: { aiFeaturesEnabled: true } }
    await expect(
      generateStructured(
        // no user: the per-user gate is skipped, the call goes straight to the injected resolver
        { user: null, feature: 'internalPing', surveyId: null, prompt: 'ping', system: 'test', schema: {} as any },
        deps as any
      )
    ).rejects.toThrow('stop after resolving')
    expect(resolveModel).toHaveBeenCalledWith(expect.objectContaining({ feature: 'internalPing' }))
  })
})
