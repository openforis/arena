import fs from 'fs'
import path from 'path'

import { getInputTitle } from '@webapp/components/form/Input/inputTitle'
import { translatePlaceholder } from '@webapp/components/form/translatePlaceholder'
import { getApiKeyFieldState } from '@webapp/components/ai/UserAiSettingsPanel/ProviderDialog/apiKeyField'
import type { ProviderDraft } from '@webapp/components/ai/UserAiSettingsPanel/ProviderDialog/providerDraft'
import type { SavedProvider } from '@webapp/components/ai/UserAiSettingsPanel/ProviderDialog/providerTypes'
import { LANGUAGES, namespaceByLanguage } from '../utils/i18nParity'

const readSource = (file: string): string => fs.readFileSync(path.join(__dirname, '../../../webapp', file), 'utf8')

const settingsByLang = namespaceByLanguage('userAiSettings')

const draft = (apiKey = ''): ProviderDraft => ({
  type: 'openai',
  name: '',
  baseUrl: '',
  model: '',
  modelFreeText: false,
  apiKey,
  apiKeyRemoved: false,
  modelTouched: false,
  apiKeyVersion: 0,
})

const saved = (patch: Partial<SavedProvider> = {}): SavedProvider => ({
  id: 'acct:1',
  kind: 'account',
  dialogType: 'openai',
  name: 'OpenAI',
  model: 'm',
  baseUrl: null,
  hasApiKey: true,
  apiKeyReadable: true,
  ...patch,
})

describe('API key field (440)', () => {
  describe('input title', () => {
    test('a text input shows its value as the title when none is given', () => {
      expect(getInputTitle({ title: null, value: 'abc', type: 'text' })).toBe('abc')
      expect(getInputTitle({ title: undefined, value: 12, type: 'number' })).toBe('12')
    })

    test('a password input never shows its value in the title', () => {
      expect(getInputTitle({ title: null, value: 'sk-secret', type: 'password' })).toBeUndefined()
      expect(getInputTitle({ title: undefined, value: 'sk-secret', type: 'password' })).toBeUndefined()
    })

    test('an explicit title wins, and an empty value has no title', () => {
      expect(getInputTitle({ title: 'Name', value: 'abc', type: 'text' })).toBe('Name')
      expect(getInputTitle({ title: 'Reveal', value: 'sk-secret', type: 'password' })).toBe('Reveal')
      expect(getInputTitle({ title: null, value: '', type: 'text' })).toBeUndefined()
    })
  })

  describe('placeholder', () => {
    const i18n = {
      t: (key: string) => (key === 'userAiSettings:apiKeySaved' ? 'Key saved' : key),
      exists: (key: string) => key === 'userAiSettings:apiKeySaved',
    }

    test('an i18n key is translated', () => {
      expect(translatePlaceholder(i18n, 'userAiSettings:apiKeySaved')).toBe('Key saved')
    })

    test('a URL or a model id is shown as it is (i18next would cut it at the ":" and the ".")', () => {
      expect(translatePlaceholder(i18n, 'https://openrouter.ai/api/v1')).toBe('https://openrouter.ai/api/v1')
      expect(translatePlaceholder(i18n, 'llama3.3:70b')).toBe('llama3.3:70b')
    })

    test('no placeholder stays none', () => {
      expect(translatePlaceholder(i18n, undefined)).toBeUndefined()
      expect(translatePlaceholder(i18n, null)).toBeNull()
      expect(translatePlaceholder(i18n, '')).toBe('')
    })
  })

  describe('field state', () => {
    test('a saved key shows a text placeholder, never bullets, and the "kept" hint', () => {
      const state = getApiKeyFieldState({ draft: draft(), saved: saved(), keyCleared: false })
      expect(state.keyKept).toBe(true)
      expect(state.placeholderKey).toBe('userAiSettings:apiKeySaved')
      expect(state.placeholderKey).not.toMatch(/[•*]/)
    })

    test('a new provider, a cleared key and a typed key show the paste placeholder', () => {
      const paste = 'userAiSettings:apiKeyPlaceholder'
      expect(getApiKeyFieldState({ draft: draft(), saved: null, keyCleared: false }).placeholderKey).toBe(paste)
      expect(getApiKeyFieldState({ draft: draft(), saved: saved(), keyCleared: true }).placeholderKey).toBe(paste)
      expect(getApiKeyFieldState({ draft: draft(' sk-1 '), saved: saved(), keyCleared: false }).placeholderKey).toBe(
        paste
      )
    })

    test('hints: cleared by an address change, unreadable key, nothing once a key is typed', () => {
      expect(getApiKeyFieldState({ draft: draft(), saved: saved(), keyCleared: true })).toMatchObject({
        keyKept: false,
        showClearedHint: true,
        showUnreadableHint: false,
      })
      expect(
        getApiKeyFieldState({ draft: draft(), saved: saved({ apiKeyReadable: false }), keyCleared: false })
      ).toMatchObject({ keyKept: false, showClearedHint: false, showUnreadableHint: true })
      expect(
        getApiKeyFieldState({ draft: draft('k'), saved: saved({ apiKeyReadable: false }), keyCleared: true })
      ).toMatchObject({ keyKept: false, showClearedHint: false, showUnreadableHint: false })
    })
  })

  describe('texts', () => {
    test.each(LANGUAGES)('%s has the saved-key placeholder as plain text', (lang) => {
      const text = settingsByLang[lang].apiKeySaved
      expect(typeof text).toBe('string')
      expect(text.trim().length).toBeGreaterThan(0)
      expect(text).not.toMatch(/[•*]/)
      // the placeholder goes through i18n.t, which reads ":" and "." as separators of a key
      expect(text).not.toMatch(/[:.]/)
    })
  })

  describe('the key field markup (static scan: there is no React renderer in the unit tests)', () => {
    const fields = readSource('components/ai/UserAiSettingsPanel/ProviderDialog/AccountProviderFields.tsx')
    const passwordInput = readSource('components/form/PasswordInput/PasswordInput.tsx')

    test('is a PasswordInput that browsers and password managers leave alone', () => {
      const field = fields.slice(
        fields.indexOf('<PasswordInput'),
        fields.indexOf('/>', fields.indexOf('<PasswordInput'))
      )
      expect(field).toContain('autoComplete="new-password"')
      for (const hint of ['data-1p-ignore', 'data-lpignore="true"', 'data-bwignore', 'data-form-type="other"']) {
        expect(field).toContain(hint)
      }
    })

    test('the PasswordInput passes data-* to the input and names its show / hide button', () => {
      expect(passwordInput).toContain('inputAttributes={getDataAttributes(props)}')
      expect(passwordInput).toMatch(/aria-pressed=\{passwordShown\}/)
      expect(passwordInput).toContain("'common.hideValue'")
      expect(passwordInput).toContain("'common.showValue'")
    })

    test('Remove key and Keep key are one toggle button, and the removed hint sits in an always rendered status', () => {
      expect(fields.match(/userAiSettings:dialog\.removeKey/g)).toHaveLength(1)
      expect(fields).toMatch(/aria-pressed=\{keyRemoved\}/)
      expect(fields).toMatch(/<div role="status" className="provider-dialog__status">\s*\{keyRemoved/)
    })
  })
})
