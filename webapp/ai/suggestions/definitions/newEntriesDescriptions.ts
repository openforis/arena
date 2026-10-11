/**
 * Card and prompt of suggestion 2 (descriptions for new entries). The turn's scope limits the list to the targets.
 */
import { getSurveyLanguages } from '@webapp/ai/tools/design/missingTexts'

import { buildNewEntriesDescriptionsPrompt } from '../prompts/designPrompts'
import type { SuggestionDefinition } from './types'

export const newEntriesDescriptionsDefinition: SuggestionDefinition = {
  kind: 'newEntriesDescriptions',
  card: (suggestion) => ({ key: 'newEntriesDescriptions.card', params: { count: suggestion.targets.length } }),
  prompt: (_suggestion, ctx) =>
    buildNewEntriesDescriptionsPrompt({ languages: ctx.survey ? getSurveyLanguages(ctx.survey) : [] }),
}
