import { useCallback, useEffect, useRef, useState } from 'react'

import { SystemLogMessage, SystemLogMessageTypes, SystemLogResetReasons } from '@common/systemLog/systemLogConstants'

import * as API from '@webapp/service/api'
import useInterval from '@webapp/components/hooks/useInterval'

import { appendLines, createLogLinesParser, LogLine, LogLinesParser, LogMarkers } from './systemLogLines'

// incoming lines are rendered in batches, so a burst of log lines causes a few renders only
const flushIntervalMs = 250

export const SystemLogStreamStatuses = {
  connecting: 'connecting',
  connected: 'connected',
  disconnected: 'disconnected',
} as const

export type SystemLogStreamStatus = (typeof SystemLogStreamStatuses)[keyof typeof SystemLogStreamStatuses]

type SourceInfo = {
  instanceId: string | null
  fileName: string | null
  fileExists: boolean
}

type UseSystemLogStreamResult = SourceInfo & {
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

const initialSourceInfo: SourceInfo = { instanceId: null, fileName: null, fileExists: true }

const resetMarkerByReason = {
  [SystemLogResetReasons.rotated]: LogMarkers.rotated,
  [SystemLogResetReasons.skipped]: LogMarkers.skipped,
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
  const [sourceInfo, setSourceInfo] = useState<SourceInfo>(initialSourceInfo)
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

  const onMessage = useCallback(
    (message: SystemLogMessage) => {
      const parser = parserRef.current
      if (message.type === SystemLogMessageTypes.init) {
        const { instanceId, fileName, fileExists, lines: initialLines, truncated } = message
        const parsedLines = parser.parse(initialLines)
        pendingRef.current = []
        setLines(truncated ? [parser.createMarker(LogMarkers.truncated), ...parsedLines] : parsedLines)
        setSourceInfo({ instanceId, fileName, fileExists })
        setConnectionState({ key: connectionKey, status: SystemLogStreamStatuses.connected, error: null })
      } else if (message.type === SystemLogMessageTypes.append) {
        pendingRef.current = appendLines(pendingRef.current, parser.parse(message.lines), maxLines)
      } else if (message.type === SystemLogMessageTypes.reset) {
        pendingRef.current = appendLines(
          pendingRef.current,
          [parser.createMarker(resetMarkerByReason[message.reason])],
          maxLines
        )
      }
    },
    [connectionKey, maxLines]
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

  const reconnect = useCallback(() => setConnectionCount((count) => count + 1), [])

  return { ...sourceInfo, lines, pendingCount, status, error, clear, reconnect }
}
