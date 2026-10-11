/**
 * Module introduction (suggestion 9): card and prompt. Do it removes the card (no change set to wait for), and Do it or
 * Dismiss records the module as seen: it never comes back.
 */
import { buildModuleIntroPrompt, isIntroModule, type IntroModule } from '../prompts/moduleIntro'
import type { AssistantSuggestion } from '../types'
import type { SuggestionDefinition } from './types'

/**
 * Returns the module of an introduction.
 * @param {AssistantSuggestion} suggestion - Introduction.
 * @returns {IntroModule} The module.
 * @throws {Error} For a module without introduction (a hand-edited storage value): the card is not shown.
 */
const moduleOf = (suggestion: AssistantSuggestion): IntroModule => {
  const module = suggestion.targets[0]?.key ?? ''
  if (!isIntroModule(module)) throw new Error(`No introduction for module "${module}"`)
  return module
}

export const moduleIntroDefinition: SuggestionDefinition = {
  kind: 'moduleIntro',
  card: (suggestion) => ({ key: `moduleIntro.card.${moduleOf(suggestion)}`, params: {} }),
  prompt: (suggestion) => buildModuleIntroPrompt(moduleOf(suggestion)),
  acceptMode: 'remove',
  onHandled: ({ userUuid, targetKeys, store }) => {
    for (const module of targetKeys) store.markModuleSeen({ userUuid, module })
  },
}
