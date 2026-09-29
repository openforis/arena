export const SystemLogConstants = {
  defaultMaxLines: 1000,
  maxLinesLimit: 10000,
}

export const SystemLogMessageTypes = {
  init: 'init',
  append: 'append',
  reset: 'reset',
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
  fileName: string
  fileExists: boolean
  lines: string[]
  truncated: boolean
}

export type SystemLogAppendMessage = {
  type: typeof SystemLogMessageTypes.append
  lines: string[]
}

export type SystemLogResetMessage = {
  type: typeof SystemLogMessageTypes.reset
  reason: SystemLogResetReason
}

export type SystemLogMessage = SystemLogInitMessage | SystemLogAppendMessage | SystemLogResetMessage
