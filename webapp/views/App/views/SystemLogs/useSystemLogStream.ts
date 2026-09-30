import { useCallback, useEffect, useRef, useState } from 'react'

import {
  SystemLogInitMessage,
  SystemLogMessage,
  SystemLogMessageTypes,
  SystemLogResetReasons,
} from '@common/systemLog/systemLogConstants'

import * as API from '@webapp/service/api'
import useInterval from '@webapp/components/hooks/useInterval'

import {
  appendLines,
  createLogLinesParser,
  LogLine,
  LogLinesParser,
  LogMarkers,
  removeInstanceLines,
} from './systemLogLines'

// incoming lines are rendered in batches, so a burst of log lines causes a few renders only
const flushIntervalMs = 250

export const SystemLogStreamStatuses = {
  connecting: 'connecting',
  connected: 'connected',
  disconnected: 'disconnected',
} as const

export type SystemLogStreamStatus = (typeof SystemLogStreamStatuses)[keyof typeof SystemLogStreamStatuses]

export type SystemLogInstance = {
  instanceId: string
  // true for the instance serving the stream
  local: boolean
  fileName: string
  fileExists: boolean
  // true when the instance stopped sending its log
  lost: boolean
}

type UseSystemLogStreamResult = {
  instances: SystemLogInstance[]
  lines: LogLine[]
  pendingCount: number
  status: SystemLogStreamStatus
  error: string | null
  clear: () => void
  reconnect: () => void
}

type ConnectionState = {
  key: string
  status: SystemLogStreamStatus
  error: string | null
}

const resetMarkerByReason = {
  [SystemLogResetReasons.rotated]: LogMarkers.rotated,
  [SystemLogResetReasons.skipped]: LogMarkers.skipped,
}

const compareInstances = (instanceA: SystemLogInstance, instanceB: SystemLogInstance): number => {
  if (instanceA.local !== instanceB.local) return instanceA.local ? -1 : 1
  return instanceA.instanceId.localeCompare(instanceB.instanceId)
}

const parseInitLines = (parser: LogLinesParser, message: SystemLogInitMessage): LogLine[] => {
  const { instanceId, lines, truncated } = message
  const parsedLines = parser.parse(instanceId, lines)
  if (!truncated) return parsedLines
  const marker = parser.createMarker({ instanceId, marker: LogMarkers.truncated, timestamp: parsedLines[0]?.timestamp })
  return [marker, ...parsedLines]
}

export const useSystemLogStream = ({
  maxLines,
  paused,
}: {
  maxLines: number
  paused: boolean
}): UseSystemLogStreamResult => {
  const [lines, setLines] = useState<LogLine[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [instancesById, setInstancesById] = useState<Record<string, SystemLogInstance>>({})
  const [connectionCount, setConnectionCount] = useState(0)
  // a new connection is opened when this key changes
  const connectionKey = `${connectionCount}_${maxLines}`
  // state of the connection identified by key: an older key means the current connection is still connecting
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    key: connectionKey,
    status: SystemLogStreamStatuses.connecting,
    error: null,
  })
  const isConnectionStateCurrent = connectionState.key === connectionKey
  const status = isConnectionStateCurrent ? connectionState.status : SystemLogStreamStatuses.connecting
  const error = isConnectionStateCurrent ? connectionState.error : null

  const parserRef = useRef<LogLinesParser>(createLogLinesParser())
  // lines received but not rendered yet (waiting for the next flush or for the stream to be resumed)
  const pendingRef = useRef<LogLine[]>([])

  const addPendingLines = useCallback(
    (newLines: LogLine[]) => {
      pendingRef.current = appendLines(pendingRef.current, newLines, maxLines)
    },
    [maxLines]
  )

  const setInstanceLost = useCallback(
    (instanceId: string, lost: boolean) =>
      setInstancesById((prev) => {
        const instance = prev[instanceId]
        return !instance || instance.lost === lost ? prev : { ...prev, [instanceId]: { ...instance, lost } }
      }),
    []
  )

  const onInit = useCallback(
    (message: SystemLogInitMessage) => {
      const { instanceId, local, fileName, fileExists } = message
      const initLines = parseInitLines(parserRef.current, message)
      // an instance can send its init again (e.g. its tail restarted): its previous lines are replaced
      pendingRef.current = removeInstanceLines(pendingRef.current, instanceId)
      setLines((prevLines) => appendLines(removeInstanceLines(prevLines, instanceId), initLines, maxLines))
      setInstancesById((prev) => ({ ...prev, [instanceId]: { instanceId, local, fileName, fileExists, lost: false } }))
      if (local) {
        setConnectionState({ key: connectionKey, status: SystemLogStreamStatuses.connected, error: null })
      }
    },
    [connectionKey, maxLines]
  )

  const onMessage = useCallback(
    (message: SystemLogMessage) => {
      const parser = parserRef.current
      const { instanceId } = message
      if (message.type === SystemLogMessageTypes.init) {
        onInit(message)
        return
      }
      if (message.type === SystemLogMessageTypes.instanceLost) {
        setInstanceLost(instanceId, true)
        return
      }
      setInstanceLost(instanceId, false)
      if (message.type === SystemLogMessageTypes.append) {
        addPendingLines(parser.parse(instanceId, message.lines))
      } else if (message.type === SystemLogMessageTypes.reset) {
        addPendingLines([parser.createMarker({ instanceId, marker: resetMarkerByReason[message.reason] })])
      }
    },
    [addPendingLines, onInit, setInstanceLost]
  )

  useEffect(() => {
    parserRef.current = createLogLinesParser()
    pendingRef.current = []
    const setDisconnected = (disconnectionError: string | null) =>
      setConnectionState({
        key: connectionKey,
        status: SystemLogStreamStatuses.disconnected,
        error: disconnectionError,
      })
    return API.streamSystemLog({
      maxLines,
      onMessage,
      onError: (streamError) => setDisconnected(streamError.message),
      onDone: () => setDisconnected(null),
    })
  }, [connectionKey, maxLines, onMessage])

  const flush = useCallback(() => {
    const pending = pendingRef.current
    if (paused) {
      setPendingCount(pending.length)
      return
    }
    if (pending.length === 0) return
    pendingRef.current = []
    setPendingCount(0)
    setLines((prevLines) => appendLines(prevLines, pending, maxLines))
  }, [maxLines, paused])

  useInterval(flush, flushIntervalMs)

  const clear = useCallback(() => {
    pendingRef.current = []
    setPendingCount(0)
    setLines([])
  }, [])

  const reconnect = useCallback(() => {
    setInstancesById({})
    setLines([])
    setConnectionCount((count) => count + 1)
  }, [])

  const instances = Object.values(instancesById).sort(compareInstances)

  return { instances, lines, pendingCount, status, error, clear, reconnect }
}
