import type { AiGenerateText, AiTextRequest } from '@common/ai/llm'

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
