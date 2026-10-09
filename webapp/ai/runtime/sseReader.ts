import type { LanguageModelV4StreamPart } from '@ai-sdk/provider'

import { createSseParser } from '@common/ai/sseParser'
import { deserializeStreamPart } from '@common/ai/wire'

/**
 * Turns the gateway SSE response into a stream of LanguageModelV4 parts; cancelling it cancels the body
 * (which aborts the request).
 * @param {Response} response - Gateway response (status 200, text/event-stream).
 * @returns {ReadableStream<LanguageModelV4StreamPart>} The parts.
 */
export const readSseParts = (response: Response): ReadableStream<LanguageModelV4StreamPart> => {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  return new ReadableStream<LanguageModelV4StreamPart>({
    async start(controller) {
      const parser = createSseParser({ onEvent: (event) => controller.enqueue(deserializeStreamPart(event)) })
      try {
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          parser.push(decoder.decode(value, { stream: true }))
        }
        parser.end()
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    },
    cancel(reason) {
      return reader.cancel(reason)
    },
  })
}
