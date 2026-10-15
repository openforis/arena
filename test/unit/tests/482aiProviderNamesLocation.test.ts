import fs from 'fs'
import path from 'path'

import { getDefaultNameKey } from '@webapp/ai/providers/providerNames'

const webappDir = path.resolve(__dirname, '../../../webapp')

describe('provider names live in webapp/ai, below the UI that uses them (482)', () => {
  test('the engines do not import the provider names from the settings panel', () => {
    const source = fs.readFileSync(path.join(webappDir, 'ai/engines/engineInfo.ts'), 'utf8')
    expect(source).toContain('@webapp/ai/providers/providerNames')
    expect(source).not.toMatch(/UserAiSettingsPanel/)
  })

  test('the module moved out of the settings panel', () => {
    expect(fs.existsSync(path.join(webappDir, 'components/ai/UserAiSettingsPanel/providerNames.ts'))).toBe(false)
  })

  test('the default names keep their translation keys', () => {
    expect(getDefaultNameKey({ name: 'Organisation server', providerType: 'openai-compatible' })).toBe(
      'userAiSettings:defaultName.orgServer'
    )
    expect(getDefaultNameKey({ name: 'My server', providerType: 'openai-compatible' })).toBeNull()
  })
})
