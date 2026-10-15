/**
 * What the suggestions host does, without React: runs the state detectors and the resolvers when a generation starts
 * and 1 s after the last survey change, and hands events to the event detectors. A failing detector never stops the
 * others. No detector calls an AI engine.
 */
import { logAiWarning, type AiLog } from '@webapp/ai/log/aiLog'
import type { AssistantArea } from '@webapp/components/ai/Assistant/assistantAreas'

import type { DetectorContext, EventDetector, StateDetector, SuggestionEvent, TargetResolver } from './detectors'
import type { SuggestionGeneration } from './generation'
import { EVENT_DETECTORS, STATE_DETECTORS, TARGET_RESOLVERS } from './registry'
import type { SuggestionStore } from './suggestionStore'

export const SUGGESTION_DEBOUNCE_MS = 1000

// events kept while the defs of the open survey load (a few per reload at most)
const MAX_QUEUED_EVENTS = 20

export type SuggestionHostInput = {
  // the Proactive suggestions setting
  enabled: boolean
  userUuid: string | null
  // the open survey, known before its defs are loaded (queued events belong to it)
  surveyId: number | null
  generation: SuggestionGeneration | null
  survey: any | null
  availableAreas: AssistantArea[]
}

export type SuggestionHostController = {
  update: (input: SuggestionHostInput) => void
  event: (event: SuggestionEvent) => void
  dispose: () => void
}

// an event waiting for the generation, with the user and survey open when it arrived (null: no input yet)
type QueuedEvent = { event: SuggestionEvent; userUuid: string | null; surveyId: number | null }

/**
 * Returns the detector context of an input, or null when nothing may run (setting off, nobody logged in).
 * @param {SuggestionHostInput|null} input - Host input.
 * @param {SuggestionStore} store - Store.
 * @param {Function} now - Clock.
 * @returns {DetectorContext|null} The context.
 */
const contextOf = (
  input: SuggestionHostInput | null,
  store: SuggestionStore,
  now: () => Date
): DetectorContext | null => {
  if (!input?.enabled || !input.userUuid) return null
  const { userUuid, generation, survey, availableAreas } = input
  return { userUuid, generation, survey, availableAreas, store, now }
}

/**
 * Returns true when a detector may run: its area is available, and a Design detector has draft defs it can edit.
 * @param {object} detector - Detector.
 * @param {DetectorContext} ctx - Context.
 * @returns {boolean} True when it runs.
 */
const canRun = (detector: { area: AssistantArea; needsDraft: boolean }, ctx: DetectorContext): boolean =>
  ctx.availableAreas.includes(detector.area) &&
  (!detector.needsDraft || (!!ctx.generation?.draft && ctx.generation.canEditSurvey))

/**
 * Runs a detector, logging its errors (sync throws and rejected promises) instead of throwing: one failing check never
 * stops the others.
 * @param {AiLog} log - Reports the error.
 * @param {string} what - What runs, for the log.
 * @param {Function} work - Detector work.
 * @returns {void}
 */
const runSafely = (log: AiLog, what: string, work: () => unknown): void => {
  try {
    const result = work()
    if (result instanceof Promise) result.catch((error: unknown) => log(`The ${what} failed`, error))
  } catch (error) {
    log(`The ${what} failed`, error)
  }
}

/**
 * Removes the targets of a kind that the resolver finds fixed: pending, in progress and dismissed ones (a suggestion
 * dismissed as a whole is no longer pending, and its dismissal must not hide the issue when it occurs again).
 * @param {TargetResolver} resolver - Resolver.
 * @param {DetectorContext} ctx - Context (with a generation).
 * @param {SuggestionGeneration} generation - Generation.
 * @returns {void}
 */
const resolveKind = (resolver: TargetResolver, ctx: DetectorContext, generation: SuggestionGeneration): void => {
  const { userUuid, store, survey } = ctx
  const { surveyId } = generation
  for (const { id, kind, targetKeys } of store.getTracked({ userUuid, surveyId })) {
    if (kind !== resolver.kind) continue
    const resolved = targetKeys.filter((key) => resolver.isResolved(key, survey))
    if (resolved.length > 0) store.removeTargets({ userUuid, surveyId, id, targetKeys: resolved })
  }
}

/**
 * Returns true when a queued event belongs to the user and survey of the input (an untagged one belongs to any).
 * @param {QueuedEvent} queued - Queued event.
 * @param {SuggestionHostInput} input - Current input.
 * @returns {boolean} True when it may be handled.
 */
const belongsTo = (queued: QueuedEvent, input: SuggestionHostInput): boolean =>
  (queued.userUuid === null || queued.userUuid === input.userUuid) &&
  (queued.surveyId === null || queued.surveyId === input.surveyId)

/**
 * Creates the controller of the suggestions host.
 * @param {object} params - Parameters.
 * @param {SuggestionStore} params.store - Store.
 * @param {Function} [params.now] - Clock.
 * @param {StateDetector[]} [params.stateDetectors] - State detectors (default: the registry).
 * @param {EventDetector[]} [params.eventDetectors] - Event detectors (default: the registry).
 * @param {TargetResolver[]} [params.resolvers] - Resolvers (default: the registry).
 * @param {number} [params.debounceMs] - Delay after the last survey change.
 * @param {AiLog} [params.log] - Reports a detector that failed.
 * @returns {SuggestionHostController} The controller.
 */
export const createSuggestionHostController = ({
  store,
  now = () => new Date(),
  stateDetectors = STATE_DETECTORS,
  eventDetectors = EVENT_DETECTORS,
  resolvers = TARGET_RESOLVERS,
  debounceMs = SUGGESTION_DEBOUNCE_MS,
  log = logAiWarning,
}: {
  store: SuggestionStore
  now?: () => Date
  stateDetectors?: StateDetector[]
  eventDetectors?: EventDetector[]
  resolvers?: TargetResolver[]
  debounceMs?: number
  log?: AiLog
}): SuggestionHostController => {
  let input: SuggestionHostInput | null = null
  // what the last run saw: a new generation runs at once, a change of survey or areas after the debounce
  let ranGenerationId: number | null = null
  let ranSurvey: any = null
  let ranAreas = ''
  let timer: ReturnType<typeof setTimeout> | null = null
  let disposed = false
  let queue: QueuedEvent[] = []
  // one derived controller per generation and area: aborted when the generation ends, the setting goes off or the area
  // leaves the available ones
  const areaControllers = new Map<
    string,
    {
      generationId: number
      area: AssistantArea
      controller: AbortController
      detach: () => void
    }
  >()

  /**
   * Aborts and discards the derived controllers that no longer apply.
   * @param {(entry: object) => boolean} keep - True for an entry that stays.
   * @returns {void}
   */
  const pruneAreaControllers = (keep: (entry: { generationId: number; area: AssistantArea }) => boolean): void => {
    for (const [key, entry] of areaControllers) {
      if (keep(entry)) continue
      entry.detach()
      entry.controller.abort()
      areaControllers.delete(key)
    }
  }

  /**
   * Returns the context a detector of an area receives: the generation gets a signal that also aborts with the setting
   * and the area.
   * @param {DetectorContext} ctx - Context.
   * @param {AssistantArea} area - Area of the detector.
   * @returns {DetectorContext} The context.
   */
  const contextForArea = (ctx: DetectorContext, area: AssistantArea): DetectorContext => {
    const { generation } = ctx
    if (!generation) return ctx
    const key = `${generation.id}:${area}`
    let entry = areaControllers.get(key)
    if (!entry) {
      const controller = new AbortController()
      const onAbort = () => controller.abort()
      if (generation.signal.aborted) controller.abort()
      else generation.signal.addEventListener('abort', onAbort, { once: true })
      // removed when the entry is pruned, so listeners do not pile up on a long generation signal
      const detach = () => generation.signal.removeEventListener('abort', onAbort)
      entry = { generationId: generation.id, area, controller, detach }
      areaControllers.set(key, entry)
    }
    return { ...ctx, generation: { ...generation, signal: entry.controller.signal } }
  }

  /**
   * Cancels the pending debounced run.
   * @returns {void}
   */
  const cancel = (): void => {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  /**
   * Runs the state detectors, then the resolvers (draft defs only), for the latest input.
   * @returns {void}
   */
  const run = (): void => {
    timer = null
    const ctx = contextOf(input, store, now)
    const generation = ctx?.generation
    // the generation that scheduled the run ended meanwhile: never run against another survey
    if (disposed || !ctx || !generation || generation.id !== ranGenerationId || generation.signal.aborted) return
    ranSurvey = ctx.survey
    ranAreas = ctx.availableAreas.join(',')
    for (const detector of stateDetectors) {
      if (!canRun(detector, ctx)) continue
      runSafely(log, `${detector.kind} detector`, () =>
        store.setKind({
          userUuid: ctx.userUuid,
          surveyId: generation.surveyId,
          kind: detector.kind,
          suggestions: detector.detect(contextForArea(ctx, detector.area)),
        })
      )
    }
    if (!generation.draft) return
    for (const resolver of resolvers) {
      runSafely(log, `${resolver.kind} resolver`, () => resolveKind(resolver, ctx, generation))
    }
  }

  /**
   * Hands an event to the event detectors listening to it.
   * @param {SuggestionEvent} event - Event.
   * @param {DetectorContext} ctx - Context.
   * @returns {void}
   */
  const dispatch = (event: SuggestionEvent, ctx: DetectorContext): void => {
    for (const detector of eventDetectors) {
      if (!detector.on.includes(event.type) || !canRun(detector, ctx)) continue
      runSafely(log, `${detector.kind} detector on ${event.type}`, () =>
        detector.handle(event, contextForArea(ctx, detector.area))
      )
    }
  }

  /**
   * Handles the queued events that can run now and drops those of another user or survey.
   * @param {DetectorContext} ctx - Context of the latest input.
   * @returns {void}
   */
  const flush = (ctx: DetectorContext): void => {
    if (queue.length === 0 || !input) return
    const ready: SuggestionEvent[] = []
    const waiting: QueuedEvent[] = []
    for (const queued of queue) {
      if (!belongsTo(queued, input)) continue
      if (ctx.generation || queued.event.type === 'moduleEntered') ready.push(queued.event)
      else waiting.push(queued)
    }
    queue = waiting
    for (const event of ready) dispatch(event, ctx)
  }

  /**
   * Runs at once on a new generation, or 1 s after the last change of survey or areas.
   * @param {DetectorContext} ctx - Context with a generation.
   * @param {SuggestionGeneration} generation - Its generation.
   * @returns {void}
   */
  const schedule = (ctx: DetectorContext, generation: SuggestionGeneration): void => {
    if (generation.id !== ranGenerationId) {
      cancel()
      ranGenerationId = generation.id
      run()
      return
    }
    if (ctx.survey === ranSurvey && ctx.availableAreas.join(',') === ranAreas) return
    cancel()
    timer = setTimeout(run, debounceMs)
  }

  return {
    update: (next) => {
      input = next
      const ctx = contextOf(next, store, now)
      if (disposed || !ctx) {
        // setting off or logged out: nothing waits
        cancel()
        ranGenerationId = null
        queue = []
        pruneAreaControllers(() => false)
        return
      }
      const { generation, availableAreas } = ctx
      pruneAreaControllers((entry) => entry.generationId === generation?.id && availableAreas.includes(entry.area))
      if (ctx.generation) {
        schedule(ctx, ctx.generation)
      } else {
        cancel()
        ranGenerationId = null
      }
      flush(ctx)
    },
    event: (event) => {
      if (disposed) return
      const ctx = contextOf(input, store, now)
      // survey events need loaded defs (they wait for them); the module introduction does not
      if (!input || (ctx && !ctx.generation && event.type !== 'moduleEntered')) {
        queue = [...queue, { event, userUuid: input?.userUuid ?? null, surveyId: input?.surveyId ?? null }].slice(
          -MAX_QUEUED_EVENTS
        )
        return
      }
      if (ctx) dispatch(event, ctx)
    },
    dispose: () => {
      disposed = true
      cancel()
      pruneAreaControllers(() => false)
      queue = []
    },
  }
}
