/**
 * Merges the text and reasoning deltas of a model stream that arrive close together into one part. A local model
 * streams a part per token; each part makes the assistant rebuild its answer and render it again, which costs more
 * the longer the answer is. One part per interval keeps that to a few updates per second whatever the speed.
 */
import type { LanguageModelV4StreamPart } from '@ai-sdk/provider'

export const COALESCE_INTERVAL_MS = 40

type DeltaPart = Extract<LanguageModelV4StreamPart, { type: 'text-delta' | 'reasoning-delta' }>

type Timers = {
  setTimer: (callback: () => void, ms: number) => unknown
  clearTimer: (timer: unknown) => void
}

/**
 * Returns true for the parts that are merged.
 * @param {LanguageModelV4StreamPart} part - A stream part.
 * @returns {boolean} True for a text or reasoning delta without provider metadata.
 */
const isMergeable = (part: LanguageModelV4StreamPart): part is DeltaPart =>
  (part.type === 'text-delta' || part.type === 'reasoning-delta') && !part.providerMetadata

/**
 * Creates the transform. A delta waits at most `intervalMs` for the ones after it; every other part (a start, an
 * end, a tool call, the finish) is sent at once, after the delta that came before it, so the order never changes.
 * @param {object} [options] - Options.
 * @param {number} [options.intervalMs] - Longest wait of a delta.
 * @param {Timers} [options.timers] - Timer functions (tests give their own).
 * @returns {TransformStream<LanguageModelV4StreamPart, LanguageModelV4StreamPart>} The transform.
 */
export const createDeltaCoalescer = ({
  intervalMs = COALESCE_INTERVAL_MS,
  timers = {
    setTimer: (callback, ms) => setTimeout(callback, ms),
    clearTimer: (timer) => clearTimeout(timer as never),
  },
}: { intervalMs?: number; timers?: Timers } = {}): TransformStream<
  LanguageModelV4StreamPart,
  LanguageModelV4StreamPart
> => {
  let pending: DeltaPart | null = null
  let timer: unknown = null

  /**
   * Sends the delta that is waiting, if any.
   * @param {TransformStreamDefaultController} controller - The stream controller.
   * @returns {void}
   */
  const flush = (controller: TransformStreamDefaultController<LanguageModelV4StreamPart>) => {
    if (timer !== null) timers.clearTimer(timer)
    timer = null
    const part = pending
    pending = null
    if (!part) return
    try {
      controller.enqueue(part)
    } catch {
      // the reader cancelled (a stopped answer) while the part waited: nothing to send it to
    }
  }

  return new TransformStream({
    transform(part, controller) {
      if (!isMergeable(part)) {
        flush(controller)
        controller.enqueue(part)
        return
      }
      if (pending && pending.type === part.type && pending.id === part.id) {
        pending = { ...pending, delta: pending.delta + part.delta }
        return
      }
      // another kind of delta, or another block: the waiting one goes first
      flush(controller)
      pending = part
      timer = timers.setTimer(() => flush(controller), intervalMs)
    },
    flush(controller) {
      flush(controller)
    },
  })
}
