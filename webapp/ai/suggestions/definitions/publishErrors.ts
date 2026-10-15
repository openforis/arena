/**
 * Card and prompt of the publish errors suggestion (errors before publishing).
 */
import { buildPublishErrorsPrompt } from '../prompts/designPrompts'
import { getTargetNodeDefNames } from './designTargetNames'
import type { SuggestionDefinition } from './types'

export const publishErrorsDefinition: SuggestionDefinition = {
  kind: 'publishErrors',
  card: (suggestion) => ({ key: 'publishErrors.card', params: { count: suggestion.targets.length } }),
  prompt: (suggestion, ctx) => buildPublishErrorsPrompt({ names: getTargetNodeDefNames(suggestion, ctx.survey) }),
}
