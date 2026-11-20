/**
 * Do it of the suggestions that the chat runs as a batch instead of a model turn (the model would propose the texts a
 * few at a time): the texts missing in a language and the descriptions of the new entries, when there are more than
 * one AI request, and the category item labels missing in a language. The chat makes them in batches and proposes
 * them on one card (workflows/assistantBatches).
 */
import type { Conversation } from '@webapp/ai/conversations/types'
import type { AiBatchProgress } from '@webapp/ai/workflows/batchRun'

export type SuggestionBatchKind = 'missingTranslations' | 'categoryItemTranslations' | 'newEntriesDescriptions'

// more texts than one AI request: a batch; fewer stay a model turn (it reads each entry before writing)
export const MISSING_TRANSLATIONS_CHAT_MAX = 20
export const NEW_ENTRIES_DESCRIPTIONS_CHAT_MAX = 10

// the tool row of the batch: its progress card while it runs, then the change set card
export const SUGGESTION_BATCH_TOOL_NAMES: Record<SuggestionBatchKind, string> = {
  missingTranslations: 'missingTexts_translate',
  categoryItemTranslations: 'categoryItemLabels_translate',
  newEntriesDescriptions: 'descriptions_write',
}

// remainingMs: estimated time left, once it can be estimated; name and count: set by the batch tools of the model
export type SuggestionBatchProgress = AiBatchProgress & { remainingMs?: number; name?: string; count?: number }

/**
 * Returns the batch of a tool row.
 * @param {string} toolName - Tool name.
 * @returns {SuggestionBatchKind|null} The batch; null for a tool of the model.
 */
export const getSuggestionBatchToolKind = (toolName: string): SuggestionBatchKind | null =>
  (Object.keys(SUGGESTION_BATCH_TOOL_NAMES) as SuggestionBatchKind[]).find(
    (kind) => SUGGESTION_BATCH_TOOL_NAMES[kind] === toolName
  ) ?? null

/**
 * Adds the estimated time left: the average time of the requests done times the requests left, from the second
 * request on (one alone is a poor average).
 * @param {AiBatchProgress} progress - Requests done and total.
 * @param {number} elapsedMs - Time since the first request started.
 * @returns {SuggestionBatchProgress} The progress.
 */
export const withRemainingTime = (progress: AiBatchProgress, elapsedMs: number): SuggestionBatchProgress => {
  const { done, total } = progress
  if (done < 2 || done >= total) return progress
  return { ...progress, remainingMs: Math.round((elapsedMs / done) * (total - done)) }
}

/**
 * Returns the batch the turn about to run is (the first message of a Do it only: the follow-ups go to the model).
 * @param {Conversation} conversation - Conversation before the turn.
 * @returns {SuggestionBatchKind|null} The suggestion kind of the batch; null for a model turn.
 */
export const getSuggestionBatchKind = ({
  messages,
  suggestionScope: scope,
}: Conversation): SuggestionBatchKind | null => {
  if (messages.length > 0 || !scope) return null
  if (scope.kind === 'newEntriesDescriptions' && scope.targetKeys.length > NEW_ENTRIES_DESCRIPTIONS_CHAT_MAX) {
    return scope.kind
  }
  // the translations need the language: a conversation saved before the scope key stays a model turn
  if (!scope.key) return null
  if (scope.kind === 'categoryItemTranslations') return scope.kind
  if (scope.kind === 'missingTranslations' && scope.targetKeys.length > MISSING_TRANSLATIONS_CHAT_MAX) return scope.kind
  return null
}
