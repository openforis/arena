import { CYRILLIC, CYRILLIC_LANGUAGES, RESOURCES } from '../utils/i18nParity'

const resources = RESOURCES

// texts of the confirmations of Delete conversation and Discard, and of the failures shown to the user
const KEYS = ['deleteConversationConfirm', 'discardConfirm', 'deleteConversationFailed', 'deleteAllFailed']

describe('assistant confirmation texts (407)', () => {
  test('every language asks before deleting a conversation and before discarding a proposal', () => {
    for (const [lang, resource] of Object.entries(resources)) {
      for (const key of KEYS) {
        const text = resource.common.aiAssistant[key]
        expect([lang, key, typeof text, text?.length > 0]).toEqual([lang, key, 'string', true])
      }
    }
  })

  test('a failed Apply is told with its message in every language', () => {
    for (const [lang, resource] of Object.entries(resources)) {
      expect([lang, resource.common.aiAssistant.card.applyFailed]).toEqual([
        lang,
        expect.stringContaining('{{message}}'),
      ])
    }
  })

  test('the texts of the Cyrillic languages are in Cyrillic', () => {
    for (const lang of CYRILLIC_LANGUAGES) {
      for (const key of KEYS) {
        expect([lang, key, CYRILLIC.test(resources[lang].common.aiAssistant[key])]).toEqual([lang, key, true])
      }
    }
  })

  test('there are no plural variants of these keys (the languages share the same keys)', () => {
    for (const key of KEYS) {
      expect(Object.keys(resources.en.common.aiAssistant).filter((name) => name.startsWith(`${key}_`))).toEqual([])
    }
  })
})
