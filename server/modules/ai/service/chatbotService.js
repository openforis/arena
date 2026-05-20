/**
 * Documentation chatbot helpers. The chatbot itself runs through the LLM
 * gateway (provider resolver + modelClient.streamChat); this module just
 * validates the inbound Vercel AI SDK v5 message envelope before the
 * gateway is invoked.
 */

const MAX_MESSAGES = 40
const MAX_MESSAGE_CHARS = 8000

/**
 * Validate the v5 message array. Returns the validated array or throws an
 * Error whose `key` matches an `appErrors` translation key.
 * @param {*} messages - Raw input from the request body.
 * @returns {Array} Validated messages.
 */
export const validateMessages = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    const err = new Error('messages must be a non-empty array')
    err.key = 'aiChatbotPayloadTooLarge'
    err.statusCode = 400
    throw err
  }
  if (messages.length > MAX_MESSAGES) {
    const err = new Error(`messages length ${messages.length} exceeds ${MAX_MESSAGES}`)
    err.key = 'aiChatbotPayloadTooLarge'
    err.statusCode = 400
    throw err
  }
  for (let i = 0; i < messages.length; i += 1) {
    const m = messages[i]
    if (!m || typeof m !== 'object') {
      const err = new Error(`message ${i} is not an object`)
      err.key = 'aiChatbotPayloadTooLarge'
      err.statusCode = 400
      throw err
    }
    if (m.role !== 'user' && m.role !== 'assistant' && m.role !== 'system') {
      const err = new Error(`message ${i} has invalid role`)
      err.key = 'aiChatbotPayloadTooLarge'
      err.statusCode = 400
      throw err
    }
    if (!Array.isArray(m.parts) || m.parts.length === 0) {
      const err = new Error(`message ${i} is missing parts`)
      err.key = 'aiChatbotPayloadTooLarge'
      err.statusCode = 400
      throw err
    }
    let totalChars = 0
    for (const p of m.parts) {
      if (!p || typeof p !== 'object' || p.type !== 'text' || typeof p.text !== 'string') {
        const err = new Error(`message ${i} has a non-text or malformed part`)
        err.key = 'aiChatbotPayloadTooLarge'
        err.statusCode = 400
        throw err
      }
      totalChars += p.text.length
    }
    if (totalChars > MAX_MESSAGE_CHARS) {
      const err = new Error(`message ${i} exceeds ${MAX_MESSAGE_CHARS} chars`)
      err.key = 'aiChatbotPayloadTooLarge'
      err.statusCode = 400
      throw err
    }
  }
  return messages
}
