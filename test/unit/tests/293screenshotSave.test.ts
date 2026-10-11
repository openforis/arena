import {
  saveScreenshotToRecord,
  startNodeSaveWaiter,
  type NodeSaveEvent,
  type NodeSaveHandlers,
  type ScreenshotSaveDeps,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotSave'

const recordUuid = 'record-1'
const blob = new Blob(['png-bytes'])
const input = { recordUuid, blob, fileName: 'cluster_2_2026-10-11.png', maxFileSizeMb: 10, availableSpaceBytes: null }

const createChange = { ok: true, kind: 'create' as const, node: { uuid: 'node-new' }, replacedFileName: null }
const updateChange = { ok: true, kind: 'update' as const, node: { uuid: 'node-old' }, replacedFileName: 'old.png' }

const flush = (): Promise<void> => new Promise((resolve) => setImmediate(resolve))

const createSocket = () => {
  let handlers: NodeSaveHandlers | null = null
  const unsubscribe = jest.fn()
  return {
    unsubscribe,
    subscribe: (nextHandlers: NodeSaveHandlers) => {
      handlers = nextHandlers
      return unsubscribe
    },
    updated: (event: NodeSaveEvent) => handlers?.onNodesUpdate(event),
    completed: (event: NodeSaveEvent) => handlers?.onCompleted(event),
    saved: (nodeUuid = 'node-new') => {
      handlers?.onNodesUpdate({ recordUuid, updatedNodes: { [nodeUuid]: {} } })
      handlers?.onCompleted({ recordUuid })
    },
    error: (event: NodeSaveEvent) => handlers?.onError(event),
  }
}

const createTimers = () => {
  const callbacks: Array<() => void> = []
  return {
    timers: {
      setTimeout: jest.fn((callback: () => void) => {
        callbacks.push(callback)
        return callbacks.length
      }),
      clearTimeout: jest.fn(),
    },
    fireAll: () => {
      for (const callback of callbacks) callback()
    },
  }
}

const setup = () => {
  const socket = createSocket()
  const clock = createTimers()
  const calls: string[] = []
  const deps: ScreenshotSaveDeps = {
    fetchRecord: jest.fn(async () => ({ uuid: recordUuid })),
    canEditRecord: jest.fn(() => true),
    buildChange: jest.fn(() => createChange),
    confirmReplace: jest.fn(async () => true),
    subscribe: jest.fn((handlers: NodeSaveHandlers) => {
      calls.push('subscribe')
      return socket.subscribe(handlers)
    }),
    postNode: jest.fn(async () => {
      calls.push('post')
    }),
    timers: clock.timers,
    timeoutMs: 1000,
  }
  return { deps, socket, clock, calls }
}

describe('Screenshot save (293)', () => {
  test('reports saved when the socket confirms before the POST resolves', async () => {
    const { deps, socket, calls } = setup()
    deps.postNode = jest.fn(async () => {
      calls.push('post')
      socket.saved()
    })
    await expect(saveScreenshotToRecord(deps, input)).resolves.toEqual({ status: 'saved' })
    expect(calls).toEqual(['subscribe', 'post'])
    expect(socket.unsubscribe).toHaveBeenCalledTimes(1)
  })

  test('reports saved when the socket confirms after the POST resolves', async () => {
    const { deps, socket } = setup()
    const promise = saveScreenshotToRecord(deps, input)
    await flush()
    expect(deps.postNode).toHaveBeenCalledWith({
      record: { uuid: recordUuid },
      node: createChange.node,
      blob,
      fileName: input.fileName,
    })
    socket.saved()
    await expect(promise).resolves.toEqual({ status: 'saved' })
  })

  test('ignores the events of other records and reports pending on timeout', async () => {
    const { deps, socket, clock } = setup()
    const promise = saveScreenshotToRecord(deps, input)
    await flush()
    socket.completed({ recordUuid: 'other-record' })
    socket.error({ recordUuid: 'other-record', key: 'x' })
    clock.fireAll()
    await expect(promise).resolves.toEqual({ status: 'pending' })
  })

  test('asks before replacing a photo and sends nothing when the user declines', async () => {
    const { deps } = setup()
    deps.buildChange = jest.fn(() => updateChange)
    deps.confirmReplace = jest.fn(async () => false)
    await expect(saveScreenshotToRecord(deps, input)).resolves.toEqual({ status: 'cancelled' })
    expect(deps.confirmReplace).toHaveBeenCalledWith('old.png')
    expect(deps.subscribe).not.toHaveBeenCalled()
    expect(deps.postNode).not.toHaveBeenCalled()
  })

  test('replaces the photo when the user confirms', async () => {
    const { deps, socket } = setup()
    deps.buildChange = jest.fn(() => updateChange)
    deps.postNode = jest.fn(async () => socket.saved('node-old'))
    await expect(saveScreenshotToRecord(deps, input)).resolves.toEqual({ status: 'saved' })
    expect(deps.postNode).toHaveBeenCalledWith(expect.objectContaining({ node: updateChange.node }))
  })

  test('does not ask when a new node is created', async () => {
    const { deps, socket } = setup()
    deps.postNode = jest.fn(async () => socket.saved())
    await saveScreenshotToRecord(deps, input)
    expect(deps.confirmReplace).not.toHaveBeenCalled()
  })

  test('refuses records the user cannot edit, or that are gone', async () => {
    const { deps } = setup()
    deps.canEditRecord = jest.fn(() => false)
    await expect(saveScreenshotToRecord(deps, input)).resolves.toEqual({
      status: 'error',
      key: 'mapWorkspace.screenshot.errors.cannotEditRecord',
    })
    deps.fetchRecord = jest.fn(async () => null)
    await expect(saveScreenshotToRecord(deps, input)).resolves.toMatchObject({
      key: 'mapWorkspace.screenshot.errors.cannotEditRecord',
    })
    expect(deps.postNode).not.toHaveBeenCalled()
  })

  test('refuses an image above the attribute max size before fetching the record', async () => {
    const { deps } = setup()
    const bigBlob = { size: 11 * 1024 * 1024 } as Blob
    await expect(saveScreenshotToRecord(deps, { ...input, blob: bigBlob })).resolves.toEqual({
      status: 'error',
      key: 'mapWorkspace.screenshot.errors.fileTooLarge',
      params: { size: '11.0', limit: 10 },
    })
    expect(deps.fetchRecord).not.toHaveBeenCalled()
  })

  test('refuses an image above the free space of the survey', async () => {
    const { deps } = setup()
    await expect(saveScreenshotToRecord(deps, { ...input, availableSpaceBytes: 5 })).resolves.toEqual({
      status: 'error',
      key: 'mapWorkspace.screenshot.errors.quotaExceeded',
    })
  })

  test('reports a plot that is not in the record', async () => {
    const { deps } = setup()
    deps.buildChange = jest.fn(() => ({ ok: false, errorKey: 'plotNotFound' as const }))
    await expect(saveScreenshotToRecord(deps, input)).resolves.toEqual({
      status: 'error',
      key: 'mapWorkspace.screenshot.errors.plotNotFound',
    })
  })

  test('reports the error of the record update sent through the socket', async () => {
    const { deps, socket } = setup()
    deps.postNode = jest.fn(async () => socket.error({ recordUuid, key: 'appErrors:generic' }))
    await expect(saveScreenshotToRecord(deps, input)).resolves.toEqual({
      status: 'error',
      key: 'mapWorkspace.screenshot.errors.saveFailed',
      params: { details: 'appErrors:generic' },
    })
  })

  test('reports a failed POST and stops listening', async () => {
    const { deps, socket, clock } = setup()
    deps.postNode = jest.fn(async () => {
      throw new Error('Network Error')
    })
    await expect(saveScreenshotToRecord(deps, input)).resolves.toEqual({
      status: 'error',
      key: 'mapWorkspace.screenshot.errors.saveFailed',
      params: { details: 'Network Error' },
    })
    expect(socket.unsubscribe).toHaveBeenCalledTimes(1)
    expect(clock.timers.clearTimeout).toHaveBeenCalled()
  })

  test('maps the server quota error', async () => {
    const { deps } = setup()
    deps.postNode = jest.fn(async () => {
      throw { response: { data: { key: 'appErrors:cannotInsertFileExceedingQuota' } } }
    })
    await expect(saveScreenshotToRecord(deps, input)).resolves.toEqual({
      status: 'error',
      key: 'mapWorkspace.screenshot.errors.quotaExceeded',
    })
  })

  test('ignores a completion of another update of the same record until this node is updated', async () => {
    const { deps, socket } = setup()
    const promise = saveScreenshotToRecord(deps, input)
    await flush()
    socket.completed({ recordUuid })
    socket.updated({ recordUuid, updatedNodes: { 'other-node': {} } })
    socket.completed({ recordUuid })
    socket.updated({ recordUuid: 'other-record', updatedNodes: { 'node-new': {} } })
    socket.completed({ recordUuid })
    expect(socket.unsubscribe).not.toHaveBeenCalled()
    socket.saved()
    await expect(promise).resolves.toEqual({ status: 'saved' })
    expect(socket.unsubscribe).toHaveBeenCalledTimes(1)
  })

  test('stops listening after the timeout', async () => {
    const { deps, socket, clock } = setup()
    const promise = saveScreenshotToRecord(deps, input)
    await flush()
    clock.fireAll()
    await expect(promise).resolves.toEqual({ status: 'pending' })
    expect(socket.unsubscribe).toHaveBeenCalledTimes(1)
  })

  test('settles the waiter only once', async () => {
    const socket = createSocket()
    const clock = createTimers()
    const waiter = startNodeSaveWaiter({
      recordUuid,
      nodeUuid: 'node-1',
      subscribe: socket.subscribe,
      timeoutMs: 10,
      timers: clock.timers,
    })
    socket.saved('node-1')
    socket.error({ recordUuid, key: 'late' })
    clock.fireAll()
    await expect(waiter.result).resolves.toEqual({ status: 'saved' })
    expect(socket.unsubscribe).toHaveBeenCalledTimes(1)
  })
})
