/**
 * Caps on what the server reads from a provider answer. The endpoint of a user is not trusted to stop: without a cap
 * it could fill the memory of the server with one endless body.
 */
import SystemError, { StatusCodes } from '@core/systemError'

type FetchLike = (input: any, init?: any) => Promise<Response>

const tooLarge = () => new SystemError('aiProviderResponseTooLarge', {}, StatusCodes.BAD_GATEWAY)

/**
 * Wraps a response so that reading its body fails once more than `maxBytes` came through (the upstream is cancelled).
 * @param {Response} response - The response.
 * @param {number} maxBytes - Cap of the body, in bytes.
 * @returns {Response} The response itself when it has no body, else one with a capped body.
 * @throws {SystemError} aiProviderResponseTooLarge (502) when the declared length is over the cap.
 */
export const limitResponseBytes = (response: Response, maxBytes: number): Response => {
  if (!response.body) return response
  const declared = Number(response.headers.get('content-length'))
  if (declared > maxBytes) {
    response.body.cancel().catch(() => undefined)
    throw tooLarge()
  }
  let received = 0
  const capped = response.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        received += chunk.byteLength
        if (received > maxBytes) controller.error(tooLarge())
        else controller.enqueue(chunk)
      },
    })
  )
  return new Response(capped, { status: response.status, statusText: response.statusText, headers: response.headers })
}

/**
 * Wraps a fetch so that every response body it answers is capped.
 * @param {FetchLike} fetchImpl - The fetch to wrap.
 * @param {number} maxBytes - Cap of a body, in bytes.
 * @returns {FetchLike} The capped fetch.
 */
export const createResponseLimitedFetch =
  (fetchImpl: FetchLike, maxBytes: number): FetchLike =>
  async (input, init) =>
    limitResponseBytes(await fetchImpl(input, init), maxBytes)

/**
 * Reads the text of a body up to a cap (for an error body to be logged), then stops the upstream.
 * @param {Response} response - The response.
 * @param {number} maxBytes - Most bytes to read.
 * @returns {Promise<string>} The text read (empty when there is no body).
 */
export const readTextCapped = async (response: Response, maxBytes: number): Promise<string> => {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  try {
    while (received < maxBytes) {
      const { value, done } = await reader.read()
      if (done) break
      chunks.push(value)
      received += value.byteLength
    }
  } finally {
    await reader.cancel().catch(() => undefined)
  }
  return new TextDecoder().decode(Buffer.concat(chunks)).slice(0, maxBytes)
}
