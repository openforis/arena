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
  onClearNonApplicableConfirm: (event: NodeSaveEvent) => void
}

export type NodeSaveSubscribe = (handlers: NodeSaveHandlers) => () => void

// nodes: all the nodes the server sent back for the record while waiting
export type NodeSaveResult = {
  status: 'saved' | 'pending' | 'error'
  details?: string
  clearsOtherValues?: boolean // the server did not apply the update: it would clear other attributes
  nodes?: Record<string, unknown>
}

export type ScreenshotSaveDeps = {
  fetchRecord: (recordUuid: string) => Promise<unknown>
  canEditRecord: (record: unknown) => boolean
  buildChange: (record: unknown) => ScreenshotNodeChange
  buildRowAttribute: (rowNode: unknown, updatedNodes: Record<string, unknown>) => unknown
  confirmReplace: (fileName: string) => Promise<boolean>
  subscribe: NodeSaveSubscribe
  postNode: (params: { record: unknown; node: unknown; blob?: Blob | null; fileName?: string }) => Promise<void>
  deleteNode: (params: { record: unknown; nodeUuid: string }) => Promise<void>
  checkOut: (recordUuid: string) => Promise<void>
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
 * @returns {object} The result, startTimer (arms the timeout, call it once the POST is done) and cancel.
 */
export const startNodeSaveWaiter = ({
  recordUuid,
  nodeUuid,
  subscribe,
  timeoutMs,
}: {
  recordUuid: string
  nodeUuid: string
  subscribe: NodeSaveSubscribe
  timeoutMs: number
}): { result: Promise<NodeSaveResult>; startTimer: () => void; cancel: () => void } => {
  let resolveResult: (value: NodeSaveResult) => void
  const result = new Promise<NodeSaveResult>((resolve) => {
    resolveResult = resolve
  })
  let settled = false
  let nodeSeen = false
  let completedSeen = false
  const nodes: Record<string, unknown> = {}
  let unsubscribe: () => void = () => undefined
  let timerId: ReturnType<typeof setTimeout> | null = null

  /**
   * Settles the result once, then stops listening.
   * @param {NodeSaveResult} value - The result.
   * @returns {void}
   */
  const finish = (value: NodeSaveResult): void => {
    if (settled) return
    settled = true
    unsubscribe()
    if (timerId !== null) clearTimeout(timerId)
    resolveResult(value)
  }

  /**
   * Tells whether a socket event is about the record being updated.
   * @param {NodeSaveEvent} event - The event.
   * @returns {boolean} True for this record.
   */
  const isForRecord = (event: NodeSaveEvent): boolean => event?.recordUuid === recordUuid

  unsubscribe = subscribe({
    // the server notifies each event after its own async socket lookup: the completion can arrive before the node
    onNodesUpdate: (event) => {
      if (!isForRecord(event) || !event?.updatedNodes) return
      Object.assign(nodes, event.updatedNodes)
      if (!event.updatedNodes[nodeUuid]) return
      nodeSeen = true
      if (completedSeen) finish({ status: 'saved', nodes })
    },
    onCompleted: (event) => {
      if (!isForRecord(event)) return
      completedSeen = true
      if (nodeSeen) finish({ status: 'saved', nodes })
    },
    // limit: the server sends no node or request id with the error, so the record is the only possible filter
    onError: (event) => {
      if (isForRecord(event)) finish({ status: 'error', details: event?.key ?? '' })
    },
    // the server then waits for a confirmation instead of applying the update, and the completion event follows
    onClearNonApplicableConfirm: (event) => {
      if (isForRecord(event)) finish({ status: 'error', clearsOtherValues: true })
    },
  })
  // armed after the POST: the upload time (slow links) must not eat the wait for the server to process the node
  const startTimer = (): void => {
    if (settled || timerId !== null) return
    timerId = setTimeout(() => finish({ status: 'pending' }), timeoutMs)
  }
  return { result, startTimer, cancel: () => finish({ status: 'pending' }) }
}

/**
 * Turns a thrown value into a short text.
 * @param {unknown} error - The thrown value.
 * @returns {string} The message.
 */
export const errorToText = (error: unknown): string => {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return JSON.stringify(error) ?? 'unknown error'
}

/**
 * Extracts a short description of a failed request.
 * @param {unknown} error - The error (axios error or other).
 * @returns {string} The server error key or message, or the error message.
 */
export const describeSaveError = (error: unknown): string => {
  const data = (error as { response?: { data?: { key?: string; message?: string } } })?.response?.data
  return data?.key ?? data?.message ?? errorToText(error)
}

/**
 * Checks the image against the attribute max size and the survey free space.
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
  if (result.clearsOtherValues) return errorOutcome('clearsOtherValues')
  return errorOutcome('saveFailed', { details: result.details ?? '' })
}

/**
 * Subscribes to the record events, posts the node (with the file, if any) and waits for the result.
 * @param {ScreenshotSaveDeps} deps - The injected dependencies.
 * @param {object} params - The record, the node, the image and its name.
 * @returns {Promise<object>} The outcome and the nodes the server sent back.
 */
const sendAndWait = async (
  deps: ScreenshotSaveDeps,
  params: { recordUuid: string; record: unknown; node: unknown; blob?: Blob | null; fileName?: string }
): Promise<{ outcome: ScreenshotSaveOutcome; nodes: Record<string, unknown> }> => {
  const { recordUuid, record, node, blob, fileName } = params
  const waiter = startNodeSaveWaiter({
    recordUuid,
    nodeUuid: (node as { uuid?: string } | undefined)?.uuid ?? '',
    subscribe: deps.subscribe,
    timeoutMs: deps.timeoutMs ?? DEFAULT_SAVE_TIMEOUT_MS,
  })
  try {
    await deps.postNode({ record, node, blob, fileName })
  } catch (error) {
    waiter.cancel()
    const details = describeSaveError(error)
    const outcome = details.includes(SERVER_QUOTA_ERROR)
      ? errorOutcome('quotaExceeded')
      : errorOutcome('saveFailed', { details })
    return { outcome, nodes: {} }
  }
  waiter.startTimer()
  const result = await waiter.result
  return { outcome: toOutcome(result), nodes: result.nodes ?? {} }
}

/**
 * Sends the change: the new entity row first when the attribute is in a multiple entity, then the image.
 * @param {ScreenshotSaveDeps} deps - The injected dependencies.
 * @param {object} params - The fetched record, the change to send and the save input.
 * @returns {Promise<ScreenshotSaveOutcome>} The outcome.
 */
const sendChange = async (
  deps: ScreenshotSaveDeps,
  { record, change, input }: { record: unknown; change: ScreenshotNodeChange; input: ScreenshotSaveInput }
): Promise<ScreenshotSaveOutcome> => {
  const { recordUuid, blob, fileName } = input
  let { node } = change
  if (change.kind !== 'createRow')
    return (await sendAndWait(deps, { recordUuid, record, node, blob, fileName })).outcome

  // two steps: the server creates the row with its empty attributes, then the image goes in the row's attribute
  const row = await sendAndWait(deps, { recordUuid, record, node })
  if (row.outcome.status === 'pending') return errorOutcome('rowNotConfirmed')
  if (row.outcome.status !== 'saved') return row.outcome
  const rowUuid = (node as { uuid: string }).uuid
  node = deps.buildRowAttribute(node, row.nodes)
  const { outcome } = await sendAndWait(deps, { recordUuid, record, node, blob, fileName })
  // best effort: do not leave the empty row behind (not when pending: the image may still land in it)
  if (outcome.status === 'error') await deps.deleteNode({ record, nodeUuid: rowUuid }).catch(() => undefined)
  return outcome
}

/**
 * Saves a screenshot in an image attribute of a plot record: checks, optional replace confirmation, POST (preceded by
 * the new entity row when the attribute is in a multiple entity), socket result.
 * @param {ScreenshotSaveDeps} deps - The injected dependencies (API, permission, node builder, prompt, socket).
 * @param {ScreenshotSaveInput} input - The record, the image, its name and the size limits.
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
  try {
    return await sendChange(deps, { record, change, input })
  } finally {
    // best effort: the nodes were posted, so the server tied this socket to the record
    await deps.checkOut(input.recordUuid).catch(() => undefined)
  }
}
