/**
 * Module introduction: the first visit to an introduced module adds its card to Help, unless the user
 * already accepted or dismissed it (seenModules).
 */
import { isIntroModule, type IntroModule } from '../prompts/moduleIntro'
import type { AssistantSuggestion } from '../types'
import type { EventDetector } from './types'

/**
 * Returns the suggestion id of the introduction of a module.
 * @param {string} module - Module.
 * @returns {string} The id.
 */
export const getModuleIntroId = (module: string): string => `moduleIntro:${module}`

/**
 * Returns the introduction of a module (Help: no survey, no cycle, no expiry; the target is the module).
 * @param {IntroModule} module - Module.
 * @param {Date} now - Creation time.
 * @returns {AssistantSuggestion} The suggestion.
 */
export const buildModuleIntroSuggestion = (module: IntroModule, now: Date): AssistantSuggestion => ({
  id: getModuleIntroId(module),
  kind: 'moduleIntro',
  area: 'help',
  surveyId: null,
  cycle: null,
  targets: [{ key: module }],
  createdAt: now.toISOString(),
  expiresAt: null,
})

export const moduleIntroDetector: EventDetector = {
  kind: 'moduleIntro',
  area: 'help',
  needsDraft: false,
  on: ['moduleEntered'],
  handle: (event, { userUuid, store, now }) => {
    if (event.type !== 'moduleEntered' || !isIntroModule(event.module)) return
    if (store.isModuleSeen({ userUuid, module: event.module })) return
    const id = getModuleIntroId(event.module)
    // a later visit keeps the card as it is
    if (store.getPending({ userUuid, surveyId: null }).some((suggestion) => suggestion.id === id)) return
    store.add({ userUuid, suggestion: buildModuleIntroSuggestion(event.module, now()) })
  },
}
