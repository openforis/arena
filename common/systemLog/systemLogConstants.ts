export const SystemLogConstants = {
  defaultMaxLines: 1000,
  maxLinesLimit: 10000,
}

export const SystemLogMessageTypes = {
  // sent once per instance (again if the instance restarts its tail): last lines of its log file
  init: 'init',
  append: 'append',
  reset: 'reset',
  // an instance stopped sending its log (e.g. shut down or unreachable)
  instanceLost: 'instanceLost',
} as const

export const SystemLogResetReasons = {
  // log file rotated (or truncated): tailing restarts from the beginning of the new file
  rotated: 'rotated',
  // too many bytes written between two reads: the oldest ones were skipped
  skipped: 'skipped',
} as const

export type SystemLogResetReason = (typeof SystemLogResetReasons)[keyof typeof SystemLogResetReasons]

export type SystemLogInitMessage = {
  type: typeof SystemLogMessageTypes.init
  instanceId: string
  // true for the instance serving the stream
  local: boolean
  fileName: string
  fileExists: boolean
  lines: string[]
  truncated: boolean
}

export type SystemLogAppendMessage = {
  type: typeof SystemLogMessageTypes.append
  instanceId: string
  lines: string[]
}

export type SystemLogResetMessage = {
  type: typeof SystemLogMessageTypes.reset
  instanceId: string
  reason: SystemLogResetReason
}

export type SystemLogInstanceLostMessage = {
  type: typeof SystemLogMessageTypes.instanceLost
  instanceId: string
}

export type SystemLogMessage =
  SystemLogInitMessage | SystemLogAppendMessage | SystemLogResetMessage | SystemLogInstanceLostMessage
