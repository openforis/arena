/**
 * Recovers the answer a local model wrote inside its reasoning. Some models (Nemotron on LM Studio) sometimes write
 * the end of their thinking as the text `</think>` instead of its token: the server then keeps what follows, often a
 * tool call (`<|tool_call>call:name{key:<|"|>value<|"|>}<tool_call|>`), as reasoning, and the step has no answer.
 */
import type { LanguageModelV4StreamPart } from '@ai-sdk/provider'
import { generateId } from 'ai'

type Part = LanguageModelV4StreamPart
type Controller = TransformStreamDefaultController<Part>
type Tail = { calls: { toolName: string; input: string }[]; text: string }

const MARKER = '</think>'
const TOOL_CALL = /<\|tool_call>call:([\w.-]+)(\{[\s\S]*?\})<tool_call\|>/g
// a string (<|"|>text<|"|>) or a bare key after { or ,
const GEMMA_TOKEN = /<\|"\|>([\s\S]*?)<\|"\|>|([{,]\s*)([A-Za-z_]\w*)(\s*:)/g

/**
 * Converts the arguments of a tool call written in the Gemma format (bare keys, <|"|> quotes) to JSON.
 * @param {string} args - The arguments, e.g. `{name:<|"|>tree<|"|>,limit:5}`.
 * @returns {string} The JSON text.
 * @throws {SyntaxError} When the result is not JSON.
 */
export const gemmaArgsToJson = (args: string): string => {
  // plain JSON first: the Gemma rewrite would break a string holding `,word:`
  try {
    return JSON.stringify(JSON.parse(args))
  } catch {
    // the Gemma format
  }
  const json = args.replace(GEMMA_TOKEN, (_match, text, before, key, colon) =>
    text === undefined ? `${before}"${key}"${colon}` : JSON.stringify(text)
  )
  return JSON.stringify(JSON.parse(json))
}

/**
 * Reads what follows the `</think>` text: the tool calls and the text around them.
 * @param {string} tail - The reasoning after the marker.
 * @returns {Tail|null} The calls and the text, or null when a call cannot be read (the tail then stays reasoning).
 */
export const readTail = (tail: string): Tail | null => {
  try {
    const calls = [...tail.matchAll(TOOL_CALL)].map(([, toolName, args]) => ({
      toolName,
      input: gemmaArgsToJson(args),
    }))
    const text = tail.replace(TOOL_CALL, '').trim()
    return text.includes('<|tool_call>') ? null : { calls, text }
  } catch {
    return null
  }
}

/**
 * Returns the length of the end of the text that may be the start of the marker (held until the next delta).
 * @param {string} text - The reasoning not sent yet.
 * @returns {number} The number of characters to hold.
 */
const heldLength = (text: string): number => {
  for (let length = Math.min(MARKER.length - 1, text.length); length > 0; length -= 1) {
    if (MARKER.startsWith(text.slice(-length))) return length
  }
  return 0
}

/**
 * Sends the text and the tool calls read from the tail.
 * @param {Tail} tail - The tail read.
 * @param {Controller} controller - The stream controller.
 * @returns {void}
 */
const enqueueTail = ({ calls, text }: Tail, controller: Controller): void => {
  if (text) {
    const id = generateId()
    controller.enqueue({ type: 'text-start', id })
    controller.enqueue({ type: 'text-delta', id, delta: text })
    controller.enqueue({ type: 'text-end', id })
  }
  for (const call of calls) controller.enqueue({ type: 'tool-call', toolCallId: generateId(), ...call })
}

/**
 * Creates the transform of a model stream that moves what follows a `</think>` text out of the reasoning.
 * @returns {TransformStream<Part, Part>} The transform.
 */
export const createThinkCloseSplitter = (): TransformStream<Part, Part> => {
  // reasoning held back because it may be the start of the marker
  let held = ''
  // what followed the marker in the current reasoning block (null: no marker yet)
  let tail: string | null = null
  let calledTools = false

  const onReasoningDelta = (part: Extract<Part, { type: 'reasoning-delta' }>, controller: Controller) => {
    if (tail !== null) {
      tail += part.delta
      return
    }
    const text = held + part.delta
    const markerAt = text.indexOf(MARKER)
    const sent = markerAt >= 0 ? text.slice(0, markerAt) : text.slice(0, text.length - heldLength(text))
    if (markerAt >= 0) tail = text.slice(markerAt + MARKER.length)
    held = markerAt >= 0 ? '' : text.slice(sent.length)
    if (sent) controller.enqueue({ ...part, delta: sent })
  }

  const onReasoningEnd = (part: Extract<Part, { type: 'reasoning-end' }>, controller: Controller) => {
    const read = tail === null ? null : readTail(tail)
    // nothing to recover: the reasoning is sent as it came
    const rest = read ? '' : held + (tail === null ? '' : MARKER + tail)
    if (rest) controller.enqueue({ type: 'reasoning-delta', id: part.id, delta: rest })
    controller.enqueue(part)
    if (read) {
      enqueueTail(read, controller)
      calledTools ||= read.calls.length > 0
    }
    held = ''
    tail = null
  }

  return new TransformStream<Part, Part>({
    transform(part, controller) {
      if (part.type === 'reasoning-delta') onReasoningDelta(part, controller)
      else if (part.type === 'reasoning-end') onReasoningEnd(part, controller)
      else if (part.type === 'finish' && calledTools) {
        controller.enqueue({ ...part, finishReason: { ...part.finishReason, unified: 'tool-calls' } })
      } else controller.enqueue(part)
    },
  })
}
