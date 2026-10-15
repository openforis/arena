/**
 * Module introductions already shown.
 */
import type { SuggestionUserState } from './types'

/**
 * Records a module as seen (module introduction).
 * @param {SuggestionUserState} state - State.
 * @param {string} module - Module.
 * @returns {SuggestionUserState} The new state (the same object when already seen).
 */
export const withModuleSeen = (state: SuggestionUserState, module: string): SuggestionUserState =>
  state.seenModules.includes(module) ? state : { ...state, seenModules: [...state.seenModules, module] }
