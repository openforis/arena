import { uuidv4 } from '@core/uuid'

import { SystemLogMessage } from '@common/systemLog/systemLogConstants'

import { LogFileStream, LogFileTailOptionsSubset, startLogFileStream } from './logFileStream'

type ClusterEvent = { targetType: string; targetId: string; eventType: string; message: any }

export type ClusterBusLike = {
  publish: (event: ClusterEvent) => Promise<void>
  onEvent: (handler: (event: ClusterEvent) => void) => void
}

const targetType = 'systemLog'

const BusEventTypes = {
  // origin -> all instances; published periodically as a lease: remote tails stop when it is not renewed
  subscribe: 'subscribe',
  unsubscribe: 'unsubscribe',
  // remote instance -> origin; message null is a heartbeat
  message: 'message',
}

export type SubscribeEventMessage = {
  sessionId: string
  originInstanceId: string
  maxLines: number
}

export type RemoteLogEventMessage = {
  sessionId: string
  instanceId: string
  // identifies a remote tail: seq restarts from 0 for every new tail
  tailId: string
  seq: number
  message: SystemLogMessage | null
}

export type SystemLogRelayTimings = {
  keepaliveIntervalMs: number
  leaseMs: number
}

export const defaultSystemLogRelayTimings: SystemLogRelayTimings = {
  keepaliveIntervalMs: 15000,
  leaseMs: 45000,
}

// limits the log volume published on the cluster bus by every remote instance
const defaultMaxBytesPerPoll = 256 * 1024

type RemoteTail = {
  stream: LogFileStream | null
  heartbeat: NodeJS.Timeout
  lastKeepaliveAt: number
  stopped: boolean
}

export type SystemLogClusterRelayOptions = {
  bus: ClusterBusLike
  instanceId: string
  getFilePath: () => string
  fileName: string
  timings?: SystemLogRelayTimings
  maxBytesPerPoll?: number
  tailOptions?: LogFileTailOptionsSubset
  onError?: (error: Error) => void
}

/**
 * Relays log lines between instances through the cluster bus:
 * the instance serving a log stream (origin) asks all the other instances to tail their own log file
 * and to publish the lines back to it.
 */
export class SystemLogClusterRelay {
  private readonly bus: ClusterBusLike
  private readonly instanceId: string
  private readonly getFilePath: () => string
  private readonly fileName: string
  private readonly maxBytesPerPoll: number
  private readonly tailOptions: LogFileTailOptionsSubset | undefined
  private readonly onError: (error: Error) => void
  readonly timings: SystemLogRelayTimings
  // sessions of other instances tailed by this instance
  private readonly remoteTails = new Map<string, RemoteTail>()
  // sessions served by this instance, receiving lines from the other instances
  private readonly originListeners = new Map<string, (eventMessage: RemoteLogEventMessage) => void>()

  constructor(options: SystemLogClusterRelayOptions) {
    const {
      bus,
      instanceId,
      getFilePath,
      fileName,
      timings = defaultSystemLogRelayTimings,
      maxBytesPerPoll = defaultMaxBytesPerPoll,
      tailOptions,
      onError = () => {},
    } = options
    this.bus = bus
    this.instanceId = instanceId
    this.getFilePath = getFilePath
    this.fileName = fileName
    this.timings = timings
    this.maxBytesPerPoll = maxBytesPerPoll
    this.tailOptions = tailOptions
    this.onError = onError
    bus.onEvent((event) => this.handleEvent(event))
  }

  get remoteTailsCount(): number {
    return this.remoteTails.size
  }

  // ==== origin side

  addOriginListener(sessionId: string, listener: (eventMessage: RemoteLogEventMessage) => void): void {
    this.originListeners.set(sessionId, listener)
  }

  removeOriginListener(sessionId: string): void {
    this.originListeners.delete(sessionId)
  }

  async publishSubscribe({ sessionId, maxLines }: { sessionId: string; maxLines: number }): Promise<void> {
    const message: SubscribeEventMessage = { sessionId, originInstanceId: this.instanceId, maxLines }
    await this.bus.publish({ targetType, targetId: sessionId, eventType: BusEventTypes.subscribe, message })
  }

  async publishUnsubscribe(sessionId: string): Promise<void> {
    await this.bus.publish({ targetType, targetId: sessionId, eventType: BusEventTypes.unsubscribe, message: {} })
  }

  // ==== events

  private handleEvent(event: ClusterEvent): void {
    if (event.targetType !== targetType) return
    const { eventType, targetId: sessionId, message } = event
    if (eventType === BusEventTypes.subscribe) {
      this.onSubscribe(message as SubscribeEventMessage)
    } else if (eventType === BusEventTypes.unsubscribe) {
      this.stopRemoteTail(sessionId)
    } else if (eventType === BusEventTypes.message) {
      this.originListeners.get(sessionId)?.(message as RemoteLogEventMessage)
    }
  }

  // ==== remote side

  private onSubscribe({ sessionId, originInstanceId, maxLines }: SubscribeEventMessage): void {
    // the origin instance streams its own log file directly
    if (originInstanceId === this.instanceId) return

    const existingTail = this.remoteTails.get(sessionId)
    if (existingTail) {
      existingTail.lastKeepaliveAt = Date.now()
      return
    }
    this.startRemoteTail({ sessionId, maxLines })
  }

  private startRemoteTail({ sessionId, maxLines }: { sessionId: string; maxLines: number }): void {
    const tailId = uuidv4()
    let seq = 0
    const publishMessage = (message: SystemLogMessage | null) => {
      const eventMessage: RemoteLogEventMessage = { sessionId, instanceId: this.instanceId, tailId, seq, message }
      seq += 1
      this.bus
        .publish({ targetType, targetId: sessionId, eventType: BusEventTypes.message, message: eventMessage })
        .catch((error) => this.onError(error))
    }

    const remoteTail: RemoteTail = {
      stream: null,
      lastKeepaliveAt: Date.now(),
      stopped: false,
      heartbeat: setInterval(() => {
        if (Date.now() - remoteTail.lastKeepaliveAt > this.timings.leaseMs) {
          // origin gone without unsubscribing (e.g. instance crashed)
          this.stopRemoteTail(sessionId)
        } else {
          publishMessage(null)
        }
      }, this.timings.keepaliveIntervalMs),
    }
    this.remoteTails.set(sessionId, remoteTail)

    startLogFileStream({
      filePath: this.getFilePath(),
      fileName: this.fileName,
      instanceId: this.instanceId,
      local: false,
      maxLines,
      maxBytesPerPoll: this.maxBytesPerPoll,
      tailOptions: this.tailOptions,
      send: publishMessage,
      onError: (error) => {
        this.onError(error)
        this.stopRemoteTail(sessionId)
      },
    })
      .then((stream) => {
        if (remoteTail.stopped) stream.stop()
        else remoteTail.stream = stream
      })
      .catch((error) => {
        this.onError(error)
        this.stopRemoteTail(sessionId)
      })
  }

  private stopRemoteTail(sessionId: string): void {
    const remoteTail = this.remoteTails.get(sessionId)
    if (!remoteTail) return
    remoteTail.stopped = true
    remoteTail.stream?.stop()
    clearInterval(remoteTail.heartbeat)
    this.remoteTails.delete(sessionId)
  }
}
