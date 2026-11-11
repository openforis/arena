import { appendFile, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { SystemLogMessage, SystemLogMessageTypes } from '@common/systemLog/systemLogConstants'
import { chunkLines, limitLinesBytes } from '@server/modules/systemLog/service/logFileStream'
import { SequencedDelivery } from '@server/modules/systemLog/service/sequencedDelivery'
import { ClusterBusLike, SystemLogClusterRelay } from '@server/modules/systemLog/service/systemLogClusterRelay'
import {
  startSystemLogStreamSession,
  SystemLogStreamSession,
} from '@server/modules/systemLog/service/systemLogStreamSession'

type BusEvent = Parameters<ClusterBusLike['publish']>[0]

// in-memory cluster bus: events are delivered asynchronously to every instance, including the publisher
const createBus = () => {
  const handlers: ((event: BusEvent) => void)[] = []
  let accept: (event: BusEvent) => boolean = () => true
  const bus: ClusterBusLike = {
    publish: async (event) => {
      const copy = structuredClone(event)
      setImmediate(() => {
        if (!accept(copy)) return
        for (const handler of handlers) handler(copy)
      })
    },
    onEvent: (handler) => {
      handlers.push(handler)
    },
  }
  return { bus, setAccept: (fn: (event: BusEvent) => boolean) => (accept = fn) }
}

const timings = { keepaliveIntervalMs: 30, leaseMs: 100 }
const tailOptions = { pollIntervalMs: 10 }

const waitFor = async (condition: () => boolean, timeoutMs = 2000) => {
  const start = Date.now()
  while (!condition()) {
    if (Date.now() - start > timeoutMs) throw new Error('timeout waiting for condition')
    await new Promise((resolve) => setTimeout(resolve, 5))
  }
}

const linesOf = (messages: SystemLogMessage[], instanceId: string) =>
  messages.flatMap((message) =>
    'lines' in message && message.instanceId === instanceId ? (message as { lines: string[] }).lines : []
  )

describe('System log cluster relay', () => {
  let folder: string
  let fileA: string
  let fileB: string
  let session: SystemLogStreamSession | null

  const createRelay = (bus: ClusterBusLike, instanceId: string, filePath: string) =>
    new SystemLogClusterRelay({
      bus,
      instanceId,
      getFilePath: () => filePath,
      fileName: 'arena.log',
      timings,
      tailOptions,
    })

  const startSession = async (relay: SystemLogClusterRelay, messages: SystemLogMessage[]) => {
    session = await startSystemLogStreamSession({
      relay,
      filePath: fileA,
      fileName: 'arena.log',
      instanceId: 'A',
      maxLines: 10,
      send: (message) => messages.push(message),
      onError: (error) => {
        throw error
      },
    })
  }

  beforeEach(async () => {
    folder = await mkdtemp(path.join(os.tmpdir(), 'arena-log-relay-'))
    fileA = path.join(folder, 'a.log')
    fileB = path.join(folder, 'b.log')
    await writeFile(fileA, 'a1\na2\n')
    await writeFile(fileB, 'b1\nb2\n')
    session = null
  })

  afterEach(async () => {
    session?.stop()
    await rm(folder, { recursive: true, force: true })
  })

  test('combines the log of the local instance and of the remote ones', async () => {
    const { bus } = createBus()
    const relayA = createRelay(bus, 'A', fileA)
    const relayB = createRelay(bus, 'B', fileB)
    const messages: SystemLogMessage[] = []
    await startSession(relayA, messages)

    await waitFor(() => messages.filter((message) => message.type === SystemLogMessageTypes.init).length === 2)
    const inits = messages.filter((message) => message.type === SystemLogMessageTypes.init)
    expect(inits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ instanceId: 'A', local: true, lines: ['a1', 'a2'] }),
        expect.objectContaining({ instanceId: 'B', local: false, lines: ['b1', 'b2'] }),
      ])
    )
    // the origin does not tail its own file through the relay
    expect(relayA.remoteTailsCount).toBe(0)
    expect(relayB.remoteTailsCount).toBe(1)

    await appendFile(fileA, 'a3\n')
    await appendFile(fileB, 'b3\nb4\n')
    await waitFor(() => linesOf(messages, 'A').includes('a3') && linesOf(messages, 'B').includes('b4'))
    expect(linesOf(messages, 'B')).toEqual(['b1', 'b2', 'b3', 'b4'])

    session.stop()
    session = null
    await waitFor(() => relayB.remoteTailsCount === 0)
  })

  test('remote tail stops when the lease is not renewed', async () => {
    const { bus, setAccept } = createBus()
    const relayA = createRelay(bus, 'A', fileA)
    const relayB = createRelay(bus, 'B', fileB)
    await startSession(relayA, [])
    await waitFor(() => relayB.remoteTailsCount === 1)

    // origin crashed: no more keepalive nor unsubscribe
    setAccept(() => false)
    await waitFor(() => relayB.remoteTailsCount === 0)
    expect(relayB.remoteTailsCount).toBe(0)
  })

  test('instance lost when it stops sending messages', async () => {
    const { bus, setAccept } = createBus()
    const relayA = createRelay(bus, 'A', fileA)
    createRelay(bus, 'B', fileB)
    const messages: SystemLogMessage[] = []
    await startSession(relayA, messages)
    await waitFor(() => linesOf(messages, 'B').length > 0)

    // messages from B do not reach A anymore
    setAccept((event) => event.message?.instanceId !== 'B')
    await waitFor(() =>
      messages.some((message) => message.type === SystemLogMessageTypes.instanceLost && message.instanceId === 'B')
    )
    expect(messages).toContainEqual({ type: SystemLogMessageTypes.instanceLost, instanceId: 'B' })
  })

  test('sequenced delivery restores the order per stream', () => {
    const delivered: string[] = []
    const delivery = new SequencedDelivery<string>((item) => delivered.push(item))
    delivery.push({ streamId: 's1', seq: 1, item: 'b' })
    delivery.push({ streamId: 's2', seq: 0, item: 'x' })
    delivery.push({ streamId: 's1', seq: 0, item: 'a' })
    delivery.push({ streamId: 's1', seq: 0, item: 'duplicate' })
    delivery.push({ streamId: 's1', seq: 2, item: 'c' })
    expect(delivered).toEqual(['x', 'a', 'b', 'c'])
  })

  test('limitLinesBytes and chunkLines', () => {
    expect(limitLinesBytes(['aaa', 'bbb', 'ccc'], 100)).toEqual({ lines: ['aaa', 'bbb', 'ccc'], skipped: false })
    expect(limitLinesBytes(['aaa', 'bbb', 'ccc'], 8)).toEqual({ lines: ['bbb', 'ccc'], skipped: true })
    expect(chunkLines(['a', 'b', 'c'], 2)).toEqual([['a', 'b'], ['c']])
    expect(chunkLines([], 2)).toEqual([])
  })
})
