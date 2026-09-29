import { SystemLogMessage, SystemLogMessageTypes } from '@common/systemLog/systemLogConstants'
import { uuidv4 } from '@core/uuid'

import { LogFileStream, startLogFileStream } from './logFileStream'
import { SequencedDelivery } from './sequencedDelivery'
import { RemoteLogEventMessage, SystemLogClusterRelay } from './systemLogClusterRelay'

export type SystemLogStreamSessionParams = {
  relay: SystemLogClusterRelay
  filePath: string
  fileName: string
  instanceId: string
  maxLines: number
  send: (message: SystemLogMessage) => void
  onError: (error: Error) => void
}

export type SystemLogStreamSession = { stop: () => void }

/**
 * Tracks when the remote instances were last heard of, to detect the ones that stopped sending their log.
 */
class RemoteInstancesTracker {
  private readonly lastSeenAtByInstance = new Map<string, number>()

  touch(instanceId: string): void {
    this.lastSeenAtByInstance.set(instanceId, Date.now())
  }

  extractLost(timeoutMs: number): string[] {
    const now = Date.now()
    const lostInstanceIds: string[] = []
    for (const [instanceId, lastSeenAt] of this.lastSeenAtByInstance) {
      if (now - lastSeenAt > timeoutMs) lostInstanceIds.push(instanceId)
    }
    for (const instanceId of lostInstanceIds) {
      this.lastSeenAtByInstance.delete(instanceId)
    }
    return lostInstanceIds
  }
}

/**
 * Streams the log of the current instance and, through the cluster relay, the logs of all the other instances.
 * @param {SystemLogStreamSessionParams} params - The parameters.
 * @returns {Promise<SystemLogStreamSession>} - The started session.
 */
export const startSystemLogStreamSession = async (
  params: SystemLogStreamSessionParams
): Promise<SystemLogStreamSession> => {
  const { relay, filePath, fileName, instanceId, maxLines, send, onError } = params
  const { keepaliveIntervalMs, leaseMs } = relay.timings
  const sessionId = uuidv4()
  const remoteInstances = new RemoteInstancesTracker()
  const delivery = new SequencedDelivery<SystemLogMessage | null>((message) => {
    // null messages are heartbeats
    if (message) send(message)
  })

  relay.addOriginListener(
    sessionId,
    ({ instanceId: remoteInstanceId, tailId, seq, message }: RemoteLogEventMessage) => {
      remoteInstances.touch(remoteInstanceId)
      delivery.push({ streamId: tailId, seq, item: message })
    }
  )

  let localStream: LogFileStream | null = null
  const keepalive = setInterval(() => {
    relay.publishSubscribe({ sessionId, maxLines })
    for (const lostInstanceId of remoteInstances.extractLost(leaseMs)) {
      send({ type: SystemLogMessageTypes.instanceLost, instanceId: lostInstanceId })
    }
  }, keepaliveIntervalMs)

  const stop = () => {
    clearInterval(keepalive)
    localStream?.stop()
    relay.removeOriginListener(sessionId)
    relay.publishUnsubscribe(sessionId)
  }

  try {
    localStream = await startLogFileStream({ filePath, fileName, instanceId, local: true, maxLines, send, onError })
  } catch (error) {
    stop()
    throw error
  }
  await relay.publishSubscribe({ sessionId, maxLines })

  return { stop }
}
