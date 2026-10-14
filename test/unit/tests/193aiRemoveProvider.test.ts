import * as ProviderResolver from '@server/modules/ai/service/providerResolver'

describe('describeAdminDefault', () => {
  test('no admin default', () => {
    expect(ProviderResolver.describeAdminDefault(null, [])).toBeNull()
  })

  test('an allowlisted base URL is org-hosted', () => {
    const adminConfig = {
      provider: 'openai-compatible',
      model: 'org-model',
      baseUrl: 'http://10.0.0.5:8000/v1',
      apiKey: 'sk-admin',
    }
    expect(ProviderResolver.describeAdminDefault(adminConfig, ['http://10.0.0.5:8000/v1'])).toEqual({
      provider: 'openai-compatible',
      model: 'org-model',
      hostingClass: 'orgHosted',
    })
  })

  test('a cloud provider without a model; the key is never returned', () => {
    const adminConfig = { provider: 'openai', model: undefined, baseUrl: undefined, apiKey: 'sk-admin' }
    const described = ProviderResolver.describeAdminDefault(adminConfig, [])
    expect(described).toEqual({ provider: 'openai', model: null, hostingClass: 'cloud' })
    expect(JSON.stringify(described)).not.toContain('sk-admin')
  })
})
