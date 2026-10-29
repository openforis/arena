/**
 * The validation report row given to the Cleaning area by "Ask the assistant": a question the user can edit,
 * followed by the row (record and node UUIDs, so the model can read and fix the value).
 */
export const cleaningRowContextMarker = '[cleaning-row-context]'

export type CleaningRowContext = {
  recordUuid: string
  recordKeys: string
  nodeUuid: string
  path: string
  messages: string[]
}

/**
 * Builds the text pre-filled in the composer.
 * @param {object} params - Parameters.
 * @param {string} params.question - The translated question.
 * @param {CleaningRowContext} params.context - The row.
 * @returns {string} The draft.
 */
export const buildRowContextDraft = ({
  question,
  context,
}: {
  question: string
  context: CleaningRowContext
}): string =>
  [
    question,
    '',
    cleaningRowContextMarker,
    `record: ${context.recordKeys} (recordUuid: ${context.recordUuid})`,
    `attribute: ${context.path} (nodeUuid: ${context.nodeUuid})`,
    `messages: ${context.messages.join('; ')}`,
  ].join('\n')

/**
 * Reads the record and node UUIDs back from a message (the mock scripts use it).
 * @param {string} text - The message.
 * @returns {{recordUuid: string, nodeUuid: string}|null} The UUIDs, or null without a row context.
 */
export const parseRowContext = (text: string): { recordUuid: string; nodeUuid: string } | null => {
  if (!text.includes(cleaningRowContextMarker)) return null
  const recordUuid = /\(recordUuid: ([\w-]+)\)/.exec(text)?.[1]
  const nodeUuid = /\(nodeUuid: ([\w-]+)\)/.exec(text)?.[1]
  return recordUuid && nodeUuid ? { recordUuid, nodeUuid } : null
}

/**
 * Returns what the chat shows for a message with a row context: the message without the marker and the UUIDs.
 * @param {string} text - The message.
 * @returns {string|null} The text to show, or null without a row context.
 */
export const toRowContextDisplayText = (text: string): string | null =>
  text.includes(cleaningRowContextMarker)
    ? text.replace(`${cleaningRowContextMarker}\n`, '').replaceAll(/ \((?:recordUuid|nodeUuid): [\w-]+\)/g, '')
    : null
