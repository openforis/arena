/**
 * Frontend client for the documentation chatbot. POSTs the Vercel AI SDK
 * v5 message array to the server-side proxy, which streams reframed
 * events (chunk / reasoning / title) back over SSE.
 */
import axios from 'axios'

import { streamSsePost } from './streaming'

/**
 * Probe whether the documentation chatbot is enabled on this deployment.
 * @returns {Promise<{enabled: boolean}>} Status payload.
 */
export const fetchStatus = async () => {
  const { data } = await axios.get('/api/ai/chatbot/status')
  return data
}

/**
 * Wrap a user / assistant message in the v5 `parts` shape expected by the
 * AIDA endpoint.
 * @param {'user'|'assistant'|'system'} role - Message role.
 * @param {string} text - Message text.
 * @returns {{role: string, parts: Array}} The v5 message.
 */
export const toV5Message = (role, text) => ({
  role,
  parts: [{ type: 'text', text }],
})

/**
 * Open a streaming conversation against `/api/ai/chatbot/conversation`.
 * The caller owns the message-list state; this function does not store
 * anything. Returns a cancel function the caller MUST invoke on
 * component unmount / panel close to abort the underlying fetch.
 * @param {object} args - Args.
 * @param {Array} args.messages - The v5 message array (full history, including the new user turn).
 * @param {string} [args.language] - Supported language code the assistant should reply in.
 * @param {Function} args.onChunk - Called with each assistant text chunk.
 * @param {Function} [args.onReasoning] - Called with each reasoning chunk.
 * @param {Function} [args.onTitle] - Called once with the conversation title (if AIDA emits one).
 * @param {Function} [args.onDone] - Called when the stream completes.
 * @param {Function} [args.onError] - Called on transport / server error.
 * @returns {Function} A cancel function.
 */
export const streamConversation = ({ messages, language, onChunk, onReasoning, onTitle, onDone, onError }) =>
  streamSsePost(
    '/api/ai/chatbot/conversation',
    { messages, language },
    { onChunk, onReasoning, onTitle, onDone, onError }
  )
