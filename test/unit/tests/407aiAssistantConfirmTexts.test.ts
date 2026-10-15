import en from '@core/i18n/resources/en'
import es from '@core/i18n/resources/es'
import fr from '@core/i18n/resources/fr'
import ja from '@core/i18n/resources/ja'
import mn from '@core/i18n/resources/mn'
import pt from '@core/i18n/resources/pt'
import ru from '@core/i18n/resources/ru'

const resources: Record<string, any> = { en, es, fr, ja, mn, pt, ru }

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

  test('the Russian and Mongolian texts are in Cyrillic', () => {
    for (const lang of ['ru', 'mn']) {
      for (const key of KEYS) {
        expect([lang, key, /[Ѐ-ӿ]/.test(resources[lang].common.aiAssistant[key])]).toEqual([lang, key, true])
      }
    }
  })

  test('there are no plural variants of these keys (the languages share the same keys)', () => {
    for (const key of KEYS) {
      expect(Object.keys(en.common.aiAssistant).filter((name) => name.startsWith(`${key}_`))).toEqual([])
    }
  })
})
