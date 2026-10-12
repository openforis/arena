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
    request: {
      designer: 'How does the form designer work?',
      data: 'How does the Data module work?',
      analysis: 'How does the Analysis module work?',
    },
  },
  missingTranslations: {
    card_one: '{{count}} text is missing in {{language}}. Translate it?',
    card_other: '{{count}} texts are missing in {{language}}. Translate them?',
    request_one: 'Translate {{count}} missing text into {{language}}.',
    request_other: 'Translate the {{count}} missing texts into {{language}}.',
  },
  newEntriesDescriptions: {
    card_one: 'You added {{count}} entry without a description. Write descriptions in all languages?',
    card_other: 'You added {{count}} entries without a description. Write descriptions in all languages?',
    request_one: 'Write descriptions in all languages for {{count}} new entry.',
    request_other: 'Write descriptions in all languages for the {{count}} new entries.',
  },
  entityWithoutKey: {
    cardSingle: '{{name}} has no key attribute. Suggest one?',
    card_one: '{{count}} entity has no key attribute. Suggest keys?',
    card_other: '{{count}} entities have no key attribute. Suggest keys?',
    requestSingle: 'Suggest a key attribute for {{name}}.',
    request_one: 'Suggest a key attribute for {{count}} entity.',
    request_other: 'Suggest key attributes for {{count}} entities.',
  },
  attributeWithoutRef: {
    cardCategory: '{{name}} has no category. Pick one?',
    cardTaxonomy: '{{name}} has no taxonomy. Pick one?',
    card_one: '{{count}} attribute has no category or taxonomy. Pick it?',
    card_other: '{{count}} attributes have no category or taxonomy. Pick them?',
    requestCategory: 'Pick a category for {{name}}.',
    requestTaxonomy: 'Pick a taxonomy for {{name}}.',
    request_one: 'Pick a category or taxonomy for {{count}} attribute.',
    request_other: 'Pick categories or taxonomies for {{count}} attributes.',
  },
  publishErrors: {
    card_one: '{{count}} entry has errors. Publishing will fail. Fix it?',
    card_other: '{{count}} entries have errors. Publishing will fail. Fix them?',
    request_one: 'Fix the errors in {{count}} entry before publishing.',
    request_other: 'Fix the errors in {{count}} entries before publishing.',
  },
  categoryItemTranslations: {
    card_one: '{{count}} category label is missing in {{language}}. Translate it?',
    card_other: '{{count}} category labels are missing in {{language}}. Translate them?',
    request_one: 'Translate {{count}} missing category label into {{language}}.',
    request_other: 'Translate the {{count}} missing category labels into {{language}}.',
  },
  validationErrors: {
    card: '{{count}} validation messages in this cycle. Summarise the patterns?',
    request: 'Summarise the patterns of the {{count}} validation messages in this cycle.',
  },
  dataImported: {
    card: 'Imported {{count}} records. Get a quick overview?',
    cardOne: 'Imported 1 record. Get a quick overview?',
    request: 'Give me a quick overview of the {{count}} imported records.',
    requestOne: 'Give me a quick overview of the imported record.',
  },
}
