export const LogLevels = {
  error: 'error',
  warn: 'warn',
  info: 'info',
  debug: 'debug',
} as const

export type LogLevel = (typeof LogLevels)[keyof typeof LogLevels]

export const allLogLevels: LogLevel[] = Object.values(LogLevels)

export const LogMarkers = {
  rotated: 'rotated',
  skipped: 'skipped',
  truncated: 'truncated',
} as const

export type LogMarker = (typeof LogMarkers)[keyof typeof LogMarkers]

export type LogLine = {
  id: number
  instanceId: string
  // log4js timestamp (sortable); inherited by lines without it, empty before the first timestamped line
  timestamp: string
  text: string
  // null when no line with a level prefix has been found yet
  level: LogLevel | null
  // set for lines added by the viewer (e.g. log file rotated), not coming from the log file
  marker?: LogMarker
}

// log4js basic layout: "[2026-09-29T10:00:00.000] [INFO] arena - message"
const linePrefixRegExp = /^\[([^\]]+)\] \[([A-Z]+)\]/

const levelByLog4jsLevel: Record<string, LogLevel> = {
  FATAL: LogLevels.error,
  ERROR: LogLevels.error,
  WARN: LogLevels.warn,
  INFO: LogLevels.info,
  MARK: LogLevels.info,
  DEBUG: LogLevels.debug,
  TRACE: LogLevels.debug,
}

export const extractLevel = (text: string): LogLevel | null => {
  const match = linePrefixRegExp.exec(text)
  return match ? (levelByLog4jsLevel[match[2]] ?? null) : null
}

export const extractTimestamp = (text: string): string | null => linePrefixRegExp.exec(text)?.[1] ?? null

export type LogLinesParser = {
  parse: (instanceId: string, texts: string[]) => LogLine[]
  createMarker: (params: { instanceId: string; marker: LogMarker; timestamp?: string }) => LogLine
}

type InstanceParseState = { level: LogLevel | null; timestamp: string }

/**
 * Creates a parser assigning a unique id, a level and a timestamp to every line.
 * Lines without prefix (e.g. stack traces) inherit level and timestamp of the previous line of the same instance.
 * @returns {LogLinesParser} - The parser.
 */
export const createLogLinesParser = (): LogLinesParser => {
  let nextId = 0
  const stateByInstance = new Map<string, InstanceParseState>()

  const getState = (instanceId: string): InstanceParseState => {
    let state = stateByInstance.get(instanceId)
    if (!state) {
      state = { level: null, timestamp: '' }
      stateByInstance.set(instanceId, state)
    }
    return state
  }

  const parse = (instanceId: string, texts: string[]): LogLine[] => {
    const state = getState(instanceId)
    return texts.map((text) => {
      state.level = extractLevel(text) ?? state.level
      state.timestamp = extractTimestamp(text) ?? state.timestamp
      nextId += 1
      return { id: nextId, instanceId, timestamp: state.timestamp, text, level: state.level }
    })
  }

  const createMarker = ({ instanceId, marker, timestamp }): LogLine => {
    nextId += 1
    return {
      id: nextId,
      instanceId,
      timestamp: timestamp ?? getState(instanceId).timestamp,
      text: '',
      level: null,
      marker,
    }
  }

  return { parse, createMarker }
}

const sortByTimestamp = (lines: LogLine[]): LogLine[] => {
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].timestamp < lines[index - 1].timestamp) {
      // stable sort: lines with the same timestamp (e.g. stack traces) keep their order
      return [...lines].sort((lineA, lineB) =>
        lineA.timestamp < lineB.timestamp ? -1 : Number(lineA.timestamp > lineB.timestamp)
      )
    }
  }
  return lines
}

// index of the first line with a timestamp greater than the specified one
const findInsertionIndex = (lines: LogLine[], timestamp: string): number => {
  let low = 0
  let high = lines.length
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (lines[middle].timestamp <= timestamp) low = middle + 1
    else high = middle
  }
  return low
}

/**
 * Merges lines (possibly coming from different instances) keeping them sorted by timestamp.
 * New lines are usually more recent than the existing ones: in that case they are simply appended.
 * @param {LogLine[]} lines - Current lines, sorted by timestamp.
 * @param {LogLine[]} newLines - Lines to merge.
 * @returns {LogLine[]} - The merged lines.
 */
export const mergeLines = (lines: LogLine[], newLines: LogLine[]): LogLine[] => {
  if (newLines.length === 0) return lines
  const sortedNewLines = sortByTimestamp(newLines)
  if (lines.length === 0) return sortedNewLines
  const insertionIndex = findInsertionIndex(lines, sortedNewLines[0].timestamp)
  if (insertionIndex === lines.length) return lines.concat(sortedNewLines)

  const tail = lines.slice(insertionIndex)
  const mergedTail: LogLine[] = []
  let tailIndex = 0
  let newIndex = 0
  while (tailIndex < tail.length || newIndex < sortedNewLines.length) {
    const takeTail =
      newIndex === sortedNewLines.length ||
      (tailIndex < tail.length && tail[tailIndex].timestamp <= sortedNewLines[newIndex].timestamp)
    mergedTail.push(takeTail ? tail[tailIndex++] : sortedNewLines[newIndex++])
  }
  return lines.slice(0, insertionIndex).concat(mergedTail)
}

/**
 * Merges new lines keeping only the most recent ones.
 * @param {LogLine[]} lines - Current lines.
 * @param {LogLine[]} newLines - Lines to append.
 * @param {number} maxLines - Maximum number of lines to keep.
 * @returns {LogLine[]} - The resulting lines.
 */
export const appendLines = (lines: LogLine[], newLines: LogLine[], maxLines: number): LogLine[] => {
  const result = mergeLines(lines, newLines)
  return result.length > maxLines ? result.slice(result.length - maxLines) : result
}

export const removeInstanceLines = (lines: LogLine[], instanceId: string): LogLine[] =>
  lines.some((line) => line.instanceId === instanceId) ? lines.filter((line) => line.instanceId !== instanceId) : lines

export type LogLinesFilter = {
  text: string
  levels: LogLevel[]
  excludedInstanceIds?: string[]
}

const isFilterEmpty = ({ text, levels, excludedInstanceIds = [] }: LogLinesFilter): boolean =>
  !text.trim() && excludedInstanceIds.length === 0 && allLogLevels.every((level) => levels.includes(level))

/**
 * Filters the lines by instance, text (case insensitive) and level.
 * Markers and lines without a level are kept, unless their instance is excluded.
 * @param {LogLine[]} lines - Lines to filter.
 * @param {LogLinesFilter} filter - The filter.
 * @returns {LogLine[]} - The filtered lines.
 */
export const filterLines = (lines: LogLine[], filter: LogLinesFilter): LogLine[] => {
  if (isFilterEmpty(filter)) return lines
  const { levels, excludedInstanceIds = [] } = filter
  const searchText = filter.text.trim().toLocaleLowerCase()
  return lines.filter(({ instanceId, text, level, marker }) => {
    if (excludedInstanceIds.includes(instanceId)) return false
    if (marker) return true
    if (level && !levels.includes(level)) return false
    return !searchText || text.toLocaleLowerCase().includes(searchText)
  })
}
