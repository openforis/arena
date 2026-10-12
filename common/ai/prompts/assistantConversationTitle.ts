import { getAnswerLanguageLabel } from './assistantDesign'

export const CONVERSATION_TITLE_TOOL_NAME = 'conversation_setTitle'

/**
 * Builds the system prompt line that asks for a conversation title (first turn only, when the tool is offered).
 * @param {string} uiLang - The user's interface language (title language).
 * @returns {string} The instruction.
 */
export const buildConversationTitleInstruction = (uiLang: string): string =>
  `This is the first message of the conversation: call ${CONVERSATION_TITLE_TOOL_NAME} once, before or together ` +
  `with your first other tool calls, with a short title (3 to 6 words, in ${getAnswerLanguageLabel(uiLang)}) that ` +
  `names its topic. Never mention the title in your answer.`
