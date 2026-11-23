import type { AiGenerateText, AiTextRequest } from '@common/ai/llm'

import type { StorageLike } from '@webapp/ai/engines/types'

/**
 * Returns a text generator that answers with the given texts, in order, and records the requests.
 * @param {...string} answers - The answers, one per call.
 * @returns {{generateText: AiGenerateText, calls: AiTextRequest[]}} The generator and the recorded requests.
 */
export const scriptedTextGenerator = (...answers: string[]) => {
  const calls: AiTextRequest[] = []
  const generateText: AiGenerateText = async (request) => {
    calls.push(request)
    if (calls.length > answers.length) throw new Error(`unexpected call #${calls.length}`)
    return answers[calls.length - 1]
  }
  return { generateText, calls }
}

/**
 * Asserts that the given promise (or function) fails with a SystemError having the given key.
 * @param {Promise|Function} target - Promise, or function returning a value or a promise.
 * @param {string} key - Expected error key.
 * @returns {Promise<object>} The error (to check params / status code).
 */
export const expectSystemErrorKey = async (target: Promise<unknown> | (() => unknown), key: string) => {
  let error = null
  try {
    await (typeof target === 'function' ? target() : target)
  } catch (err) {
    error = err
  }
  expect(error?.key).toBe(key)
  return error
}

/**
 * Creates an in-memory storage.
 * @param {Record<string, string>} [initial] - Initial entries.
 * @returns {StorageLike & { data: Map<string, string> }} The storage, with its entries in `data`.
 */
export const memoryStorage = (initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>(Object.entries(initial))
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, String(value))
    },
  }
}

// storage that fails like a blocked or full localStorage
export const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error('SecurityError')
  },
  setItem: () => {
    throw new Error('QuotaExceededError')
  },
}

// language model prompt messages, for the mock scripts tests
export const systemMessage = (text: string): any => ({ role: 'system', content: text })
export const userMessage = (text: string): any => ({ role: 'user', content: [{ type: 'text', text }] })
export const toolCallMessage = (id: string, toolName: string): any => ({
  role: 'assistant',
  content: [{ type: 'tool-call', toolCallId: id, toolName, input: {} }],
})
export const toolResultMessage = (id: string, toolName: string, value: unknown = {}): any => ({
  role: 'tool',
  content: [{ type: 'tool-result', toolCallId: id, toolName, output: { type: 'json', value } }],
})
