import { checkScreenshotSize } from '@webapp/components/MapContainer/workspace/screenshot/screenshotChecks'
import type { ScreenshotNodeChange } from '@webapp/components/MapContainer/workspace/screenshot/screenshotNode'
import type { ScreenshotSaveOutcome } from '@webapp/components/MapContainer/workspace/screenshot/screenshotTypes'

export const DEFAULT_SAVE_TIMEOUT_MS = 30000

const ERRORS_PREFIX = 'mapWorkspace.screenshot.errors'
const SERVER_QUOTA_ERROR = 'cannotInsertFileExceedingQuota'

export type NodeSaveEvent =
  { recordUuid?: string; key?: string; updatedNodes?: Record<string, unknown> } | null | undefined

export type NodeSaveHandlers = {
  onNodesUpdate: (event: NodeSaveEvent) => void
  onCompleted: (event: NodeSaveEvent) => void
  onError: (event: NodeSaveEvent) => void
}

export type NodeSaveSubscribe = (handlers: NodeSaveHandlers) => () => void

export type SaveTimers = {
  setTimeout: (callback: () => void, ms: number) => unknown
  clearTimeout: (id: unknown) => void
}

export type NodeSaveResult = { status: 'saved' | 'pending' | 'error'; details?: string }

export type ScreenshotSaveDeps = {
  fetchRecord: (recordUuid: string) => Promise<unknown>
  canEditRecord: (record: unknown) => boolean
  buildChange: (record: unknown) => ScreenshotNodeChange
  confirmReplace: (fileName: string) => Promise<boolean>
  subscribe: NodeSaveSubscribe
  postNode: (params: { record: unknown; node: unknown; blob: Blob; fileName: string }) => Promise<void>
  timers: SaveTimers
  timeoutMs?: number
}

export type ScreenshotSaveInput = {
  recordUuid: string
  blob: Blob
  fileName: string
  maxFileSizeMb: number
  availableSpaceBytes: number | null
}

/**
 * Builds an error outcome with a key of the screenshot errors section.
 * @param {string} key - The error key, without prefix.
 * @param {object} [params] - The message parameters.
 * @returns {ScreenshotSaveOutcome} The outcome.
 */
const errorOutcome = (key: string, params?: Record<string, string | number>): ScreenshotSaveOutcome =>
  params
    ? { status: 'error', key: `${ERRORS_PREFIX}.${key}`, params }
    : { status: 'error', key: `${ERRORS_PREFIX}.${key}` }

/**
 * Starts listening to the record update events; the result settles once (saved, error or timeout).
 * Must be started BEFORE the POST: the socket event can arrive before the HTTP response.
 * @param {object} params - The parameters.
 * @param {string} params.recordUuid - The record being updated.
 * @param {string} params.nodeUuid - The uuid of the node sent: the completion counts only after an update including it.
 * @param {NodeSaveSubscribe} params.subscribe - Subscribes to the socket events, returns the unsubscribe function.
 * @param {number} params.timeoutMs - Time after which the result is "pending".
 * @param {SaveTimers} params.timers - Injected timers.
 * @returns {{result: Promise<NodeSaveResult>, cancel: Function}} The result and a way to stop listening.
 */
export const startNodeSaveWaiter = ({
  recordUuid,
  nodeUuid,
  subscribe,
  timeoutMs,
  timers,
}: {
  recordUuid: string
  nodeUuid: string
  subscribe: NodeSaveSubscribe
  timeoutMs: number
  timers: SaveTimers
}): { result: Promise<NodeSaveResult>; cancel: () => void } => {
  let resolveResult: (value: NodeSaveResult) => void = () => undefined
  const result = new Promise<NodeSaveResult>((resolve) => {
    resolveResult = resolve
  })
  let settled = false
  let nodeSeen = false
  let unsubscribe: () => void = () => undefined
  let timerId: unknown = null

  /**
   * Settles the result once, then stops listening.
   * @param {NodeSaveResult} value - The result.
   * @returns {void}
   */
  const finish = (value: NodeSaveResult): void => {
    if (settled) return
    settled = true
    unsubscribe()
    timers.clearTimeout(timerId)
    resolveResult(value)
  }

  /**
   * Tells whether a socket event is about the record being updated.
   * @param {NodeSaveEvent} event - The event.
   * @returns {boolean} True for this record.
   */
  const isForRecord = (event: NodeSaveEvent): boolean => event?.recordUuid === recordUuid

  unsubscribe = subscribe({
    onNodesUpdate: (event) => {
      if (isForRecord(event) && event?.updatedNodes?.[nodeUuid]) nodeSeen = true
    },
    // the completion of another update of the same record (before this node is processed) is ignored
    onCompleted: (event) => {
      if (nodeSeen && isForRecord(event)) finish({ status: 'saved' })
    },
    // limit: the server sends no node or request id with the error, so the record is the only possible filter
    onError: (event) => {
      if (isForRecord(event)) finish({ status: 'error', details: event?.key ?? '' })
    },
  })
  timerId = timers.setTimeout(() => finish({ status: 'pending' }), timeoutMs)
  return { result, cancel: () => finish({ status: 'pending' }) }
}

/**
 * Extracts a short description of a failed request.
 * @param {unknown} error - The error (axios error or other).
 * @returns {string} The server error key or message, or the error message.
 */
export const describeSaveError = (error: unknown): string => {
  const data = (error as { response?: { data?: { key?: string; message?: string } } })?.response?.data
  return data?.key ?? data?.message ?? (error as Error)?.message ?? String(error)
}

/**
 * Checks the PNG against the attribute max size and the survey free space.
 * @param {ScreenshotSaveInput} input - The save input.
 * @returns {ScreenshotSaveOutcome|null} An error outcome, or null when the size is fine.
 */
const checkSize = (input: ScreenshotSaveInput): ScreenshotSaveOutcome | null => {
  const check = checkScreenshotSize({
    sizeBytes: input.blob.size,
    maxFileSizeMb: input.maxFileSizeMb,
    availableSpaceBytes: input.availableSpaceBytes,
  })
  if (!('reason' in check)) return null
  if (check.reason === 'quota') return errorOutcome('quotaExceeded')
  return errorOutcome('fileTooLarge', { size: check.sizeMb.toFixed(1), limit: check.limitMb.toFixed(1) })
}

/**
 * Maps the socket result to the dialog outcome.
 * @param {NodeSaveResult} result - The socket result.
 * @returns {ScreenshotSaveOutcome} The outcome.
 */
const toOutcome = (result: NodeSaveResult): ScreenshotSaveOutcome => {
  if (result.status === 'saved') return { status: 'saved' }
  if (result.status === 'pending') return { status: 'pending' }
  return errorOutcome('saveFailed', { details: result.details ?? '' })
}

/**
 * Subscribes to the record events, posts the node with the file and waits for the result.
 * @param {ScreenshotSaveDeps} deps - The injected dependencies.
 * @param {object} params - The record, the node, the PNG and its name.
 * @returns {Promise<ScreenshotSaveOutcome>} The outcome.
 */
const sendAndWait = async (
  deps: ScreenshotSaveDeps,
  params: { recordUuid: string; nodeUuid: string; record: unknown; node: unknown; blob: Blob; fileName: string }
): Promise<ScreenshotSaveOutcome> => {
  const { recordUuid, nodeUuid, record, node, blob, fileName } = params
  const waiter = startNodeSaveWaiter({
    recordUuid,
    nodeUuid,
    subscribe: deps.subscribe,
    timeoutMs: deps.timeoutMs ?? DEFAULT_SAVE_TIMEOUT_MS,
    timers: deps.timers,
  })
  try {
    await deps.postNode({ record, node, blob, fileName })
  } catch (error) {
    waiter.cancel()
    const details = describeSaveError(error)
    return details.includes(SERVER_QUOTA_ERROR)
      ? errorOutcome('quotaExceeded')
      : errorOutcome('saveFailed', { details })
  }
  return toOutcome(await waiter.result)
}

/**
 * Saves a screenshot in an image attribute of a plot record: checks, optional replace confirmation, POST, socket result.
 * @param {ScreenshotSaveDeps} deps - The injected dependencies (API, permission, node builder, prompt, socket, timers).
 * @param {ScreenshotSaveInput} input - The record, the PNG, its name and the size limits.
 * @returns {Promise<ScreenshotSaveOutcome>} The outcome.
 */
export const saveScreenshotToRecord = async (
  deps: ScreenshotSaveDeps,
  input: ScreenshotSaveInput
): Promise<ScreenshotSaveOutcome> => {
  const sizeError = checkSize(input)
  if (sizeError) return sizeError
  const record = await deps.fetchRecord(input.recordUuid)
  if (!record || !deps.canEditRecord(record)) return errorOutcome('cannotEditRecord')
  const change = deps.buildChange(record)
  if (!change.ok) return errorOutcome(change.errorKey ?? 'plotNotFound')
  if (change.replacedFileName && !(await deps.confirmReplace(change.replacedFileName))) {
    return { status: 'cancelled' }
  }
  return sendAndWait(deps, {
    recordUuid: input.recordUuid,
    nodeUuid: (change.node as { uuid?: string } | undefined)?.uuid ?? '',
    record,
    node: change.node,
    blob: input.blob,
    fileName: input.fileName,
  })
}
