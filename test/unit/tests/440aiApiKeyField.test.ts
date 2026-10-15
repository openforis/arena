import { getInputTitle } from '@webapp/components/form/Input/inputTitle'
import { translatePlaceholder } from '@webapp/components/form/translatePlaceholder'
import { getApiKeyFieldState } from '@webapp/components/ai/UserAiSettingsPanel/ProviderDialog/apiKeyField'
import type {
  ProviderDraft,
  SavedProvider,
} from '@webapp/components/ai/UserAiSettingsPanel/ProviderDialog/providerDraft'

import en from '@core/i18n/resources/en/userAiSettings'
import es from '@core/i18n/resources/es/userAiSettings'
import fr from '@core/i18n/resources/fr/userAiSettings'
import ja from '@core/i18n/resources/ja/userAiSettings'
import mn from '@core/i18n/resources/mn/userAiSettings'
import pt from '@core/i18n/resources/pt/userAiSettings'
import ru from '@core/i18n/resources/ru/userAiSettings'

const settingsByLang: Record<string, any> = { en, es, fr, ja, mn, pt, ru }

const draft = (apiKey = ''): ProviderDraft => ({
  type: 'openai',
  name: '',
  baseUrl: '',
  model: '',
  modelFreeText: false,
  apiKey,
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
    test.each(Object.keys(settingsByLang))('%s has the saved-key placeholder as plain text', (lang) => {
      const text = settingsByLang[lang].apiKeySaved
      expect(typeof text).toBe('string')
      expect(text.trim().length).toBeGreaterThan(0)
      expect(text).not.toMatch(/[•*]/)
      // the placeholder goes through i18n.t, which reads ":" and "." as separators of a key
      expect(text).not.toMatch(/[:.]/)
    })
  })
})
