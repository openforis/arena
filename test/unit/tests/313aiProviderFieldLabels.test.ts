import { AI_PROVIDER_FIELD_MAX_CHARS } from '@common/ai/providerLimits'
import { LANGUAGES, getNamespaceText, placeholders } from '@test/unit/utils/aiSuggestionsI18n'

describe('the field of aiProviderFieldTooLong is shown by its label (313)', () => {
  test.each(LANGUAGES)('%s names every limited field and uses the label in the message', (lang) => {
    const message = getNamespaceText(lang, 'appErrors', 'aiProviderFieldTooLong') as string
    expect(message).toContain('$t(appErrors:aiProviderFieldNames.{{field}})')
    // the raw field id is only the key of the label, and the limit is still shown
    expect(message.replace('$t(appErrors:aiProviderFieldNames.{{field}})', '')).not.toContain('{{field}}')
    expect(placeholders(message)).toContain('max')
    for (const field of Object.keys(AI_PROVIDER_FIELD_MAX_CHARS)) {
      const label = getNamespaceText(lang, 'appErrors', `aiProviderFieldNames.${field}`)
      expect({ lang, field, ok: typeof label === 'string' && label.length > 0 && label !== field }).toEqual({
        lang,
        field,
        ok: true,
      })
    }
  })
})
