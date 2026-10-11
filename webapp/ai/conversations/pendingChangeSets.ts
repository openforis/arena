/**
 * Change set cards that wait for the user: neither applied nor discarded.
 */
import type { ChangeSet, ChangeSetCardState } from '@webapp/ai/changeSets/types'

import type { Conversation } from './types'

/**
 * Returns true when a card is neither applied nor discarded.
 * @param {ChangeSetCardState} cardState - Card state.
 * @returns {boolean} True when pending.
 */
export const isChangeSetPending = (cardState: ChangeSetCardState): boolean =>
  !cardState.discarded && cardState.results === undefined

/**
 * Returns the change sets of the pending cards of a conversation.
 * @param {Conversation} conversation - Conversation.
 * @returns {ChangeSet[]} The change sets.
 */
export const getPendingChangeSets = (conversation: Pick<Conversation, 'changeSets'>): ChangeSet[] =>
  Object.values(conversation.changeSets)
    .filter(isChangeSetPending)
    .map((cardState) => cardState.changeSet)
