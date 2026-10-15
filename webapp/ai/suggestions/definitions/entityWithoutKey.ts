/**
 * Card and prompt of the entity without a key suggestion (entity without a key).
 */
import { buildEntityWithoutKeyPrompt } from '../prompts/designPrompts'
import { getTargetNodeDefNames } from './designTargetNames'
import type { SuggestionDefinition } from './types'

export const entityWithoutKeyDefinition: SuggestionDefinition = {
  kind: 'entityWithoutKey',
  card: (suggestion, ctx) => {
    const names = getTargetNodeDefNames(suggestion, ctx.survey)
    if (suggestion.targets.length === 1 && names.length === 1) {
      return { key: 'entityWithoutKey.cardSingle', params: { name: names[0] } }
    }
    return { key: 'entityWithoutKey.card', params: { count: suggestion.targets.length } }
  },
  prompt: (suggestion, ctx) => buildEntityWithoutKeyPrompt({ names: getTargetNodeDefNames(suggestion, ctx.survey) }),
}
