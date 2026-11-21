import { AiDataClass, getAiDataClassLevel, isAiDataClass } from '@common/ai/features'

/**
 * Returns true for the structured error results of the tool wrapper.
 * @param {unknown} output - Tool output.
 * @returns {boolean} True when the output is `{ error: … }`.
 */
export const isToolErrorOutput = (output: unknown): boolean =>
  typeof output === 'object' && output !== null && 'error' in output

/**
 * Returns the data class of a conversation.
 * @param {object} [conversation] - The conversation.
 * @returns {AiDataClass} Schema when missing, data when the stored value is unknown.
 */
export const getConversationDataClass = (conversation?: { dataClass?: unknown } | null): AiDataClass => {
  const dataClass = conversation?.dataClass
  if (dataClass === undefined || dataClass === null) return AiDataClass.schema
  return isAiDataClass(dataClass) ? dataClass : AiDataClass.data
}

/**
 * Raises the data class of a conversation; it never goes back down.
 * @param {object} params - Parameters.
 * @param {object} params.conversation - The conversation.
 * @param {AiDataClass} params.dataClass - Class of the content that entered the conversation.
 * @returns {object} The updated copy, or the same conversation when the class does not change.
 */
export const escalateConversationDataClass = <T extends { dataClass?: unknown }>({
  conversation,
  dataClass,
}: {
  conversation: T
  dataClass: AiDataClass
}): T => {
  const current = getConversationDataClass(conversation)
  if (getAiDataClassLevel(dataClass) <= getAiDataClassLevel(current)) return conversation
  return { ...conversation, dataClass }
}

/**
 * Returns true when a tool result brings record data into the conversation.
 * @param {object} params - Parameters.
 * @param {object} [params.tool] - The tool that produced the output.
 * @param {unknown} params.output - The tool output.
 * @returns {boolean} Whether the conversation must be escalated to data.
 */
export const isDataToolResult = ({ tool, output }: { tool?: { dataClass: AiDataClass }; output: unknown }): boolean =>
  tool?.dataClass === AiDataClass.data && !isToolErrorOutput(output)
