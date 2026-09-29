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
  text: string
  // null when no line with a level prefix has been found yet
  level: LogLevel | null
  // set for lines added by the viewer (e.g. log file rotated), not coming from the log file
  marker?: LogMarker
}

// log4js basic layout: "[2026-09-29T10:00:00.000] [INFO] arena - message"
const levelPrefixRegExp = /^\[[^\]]+\] \[([A-Z]+)\]/

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
  const match = levelPrefixRegExp.exec(text)
  return match ? (levelByLog4jsLevel[match[1]] ?? null) : null
}

export type LogLinesParser = {
  parse: (texts: string[]) => LogLine[]
  createMarker: (marker: LogMarker) => LogLine
}

/**
 * Creates a parser assigning a unique id and a level to every line.
 * Lines without a level prefix (e.g. stack traces) inherit the level of the previous line.
 * @returns {LogLinesParser} - The parser.
 */
export const createLogLinesParser = (): LogLinesParser => {
  let nextId = 0
  let lastLevel: LogLevel | null = null

  const parse = (texts: string[]): LogLine[] =>
    texts.map((text) => {
      lastLevel = extractLevel(text) ?? lastLevel
      nextId += 1
      return { id: nextId, text, level: lastLevel }
    })

  const createMarker = (marker: LogMarker): LogLine => {
    nextId += 1
    return { id: nextId, text: '', level: null, marker }
  }

  return { parse, createMarker }
}

/**
 * Appends lines keeping only the most recent ones.
 * @param {LogLine[]} lines - Current lines.
 * @param {LogLine[]} newLines - Lines to append.
 * @param {number} maxLines - Maximum number of lines to keep.
 * @returns {LogLine[]} - The resulting lines.
 */
export const appendLines = (lines: LogLine[], newLines: LogLine[], maxLines: number): LogLine[] => {
  if (newLines.length === 0 && lines.length <= maxLines) return lines
  const result = newLines.length === 0 ? lines : lines.concat(newLines)
  return result.length > maxLines ? result.slice(result.length - maxLines) : result
}

export type LogLinesFilter = {
  text: string
  levels: LogLevel[]
}

const isFilterEmpty = ({ text, levels }: LogLinesFilter): boolean =>
  !text.trim() && allLogLevels.every((level) => levels.includes(level))

/**
 * Filters the lines by text (case insensitive) and level; markers and lines without a level are always kept.
 * @param {LogLine[]} lines - Lines to filter.
 * @param {LogLinesFilter} filter - The filter.
 * @returns {LogLine[]} - The filtered lines.
 */
export const filterLines = (lines: LogLine[], filter: LogLinesFilter): LogLine[] => {
  if (isFilterEmpty(filter)) return lines
  const searchText = filter.text.trim().toLocaleLowerCase()
  return lines.filter(({ text, level, marker }) => {
    if (marker) return true
    if (level && !filter.levels.includes(level)) return false
    return !searchText || text.toLocaleLowerCase().includes(searchText)
  })
}
