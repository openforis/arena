import { getDefaultNameKey } from '@webapp/ai/providers/providerNames'

describe('provider names live in webapp/ai, below the UI that uses them (482)', () => {
  test('the default names keep their translation keys', () => {
    expect(getDefaultNameKey({ name: 'Organisation server', providerType: 'openai-compatible' })).toBe(
      'userAiSettings:defaultName.orgServer'
    )
    expect(getDefaultNameKey({ name: 'My server', providerType: 'openai-compatible' })).toBeNull()
  })
})
