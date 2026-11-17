/**
 * Documentation chatbot helpers. The chatbot itself runs through the LLM
 * gateway (provider resolver + modelClient.streamChat); this module just
 * validates the inbound Vercel AI SDK v5 message envelope before the
 * gateway is invoked.
 */

const MAX_MESSAGES = 40
const MAX_MESSAGE_CHARS = 8000

const ALLOWED_ROLES = new Set(['user', 'assistant', 'system'])

const badRequest = (message) => {
  const err = new Error(message)
  err.key = 'aiChatbotPayloadTooLarge'
  err.statusCode = 400
  return err
}

const isTextPart = (p) => p && typeof p === 'object' && p.type === 'text' && typeof p.text === 'string'

const validateMessage = (m, i) => {
  if (!m || typeof m !== 'object') throw badRequest(`message ${i} is not an object`)
  if (!ALLOWED_ROLES.has(m.role)) throw badRequest(`message ${i} has invalid role`)
  if (!Array.isArray(m.parts) || m.parts.length === 0) throw badRequest(`message ${i} is missing parts`)

  let totalChars = 0
  for (const p of m.parts) {
    if (!isTextPart(p)) throw badRequest(`message ${i} has a non-text or malformed part`)
    totalChars += p.text.length
  }
  if (totalChars > MAX_MESSAGE_CHARS) throw badRequest(`message ${i} exceeds ${MAX_MESSAGE_CHARS} chars`)
}

/**
 * Validate the v5 message array. Returns the validated array or throws an
 * Error whose `key` matches an `appErrors` translation key.
 * @param {*} messages - Raw input from the request body.
 * @returns {Array} Validated messages.
 */
export const validateMessages = (messages) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw badRequest('messages must be a non-empty array')
  }
  if (messages.length > MAX_MESSAGES) {
    throw badRequest(`messages length ${messages.length} exceeds ${MAX_MESSAGES}`)
  }
  for (let i = 0; i < messages.length; i++) {
    validateMessage(messages[i], i)
  }
  return messages
}
