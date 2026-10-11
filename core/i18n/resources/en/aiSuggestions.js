export default {
  // the assistant button when suggestions wait (screen readers; the dot shows it)
  buttonLabel_one: 'AI assistant: {{count}} suggestion',
  buttonLabel_other: 'AI assistant: {{count}} suggestions',
  listLabel: 'Suggestions',
  doIt: 'Do it',
  dismiss: 'Dismiss',
  moduleIntro: {
    card: {
      designer: 'New to the form designer? Ask me how it works.',
      data: 'New to the Data module? Ask me how it works.',
      analysis: 'New to the Analysis module? Ask me how it works.',
    },
  },
  missingTranslations: {
    card_one: '{{count}} text is missing in {{language}}. Translate it?',
    card_other: '{{count}} texts are missing in {{language}}. Translate them?',
  },
  newEntriesDescriptions: {
    card_one: 'You added {{count}} entry without a description. Write descriptions in all languages?',
    card_other: 'You added {{count}} entries without a description. Write descriptions in all languages?',
  },
  entityWithoutKey: {
    cardSingle: '{{name}} has no key attribute. Suggest one?',
    card_one: '{{count}} entity has no key attribute. Suggest keys?',
    card_other: '{{count}} entities have no key attribute. Suggest keys?',
  },
}
