import {
  allLogLevels,
  appendLines,
  createLogLinesParser,
  extractLevel,
  extractTimestamp,
  filterLines,
  LogLevels,
  LogMarkers,
  mergeLines,
  removeInstanceLines,
} from '@webapp/views/App/views/SystemLogs/systemLogLines'

const errorLine = '[2026-09-29T10:00:00.000] [ERROR] arena - Something failed'
const stackLine = '    at fn (/app/server.js:1:1)'
const infoLine = '[2026-09-29T10:00:01.000] [INFO] arena - Server started'
const debugLine = '[2026-09-29T10:00:02.000] [DEBUG] arena - Query executed'

const logLine = (second: number, text: string) =>
  `[2026-09-29T10:00:${String(second).padStart(2, '0')}.000] [INFO] ${text}`
const texts = (lines: { text: string }[]) => lines.map((line) => line.text)

describe('System log lines', () => {
  test('extractLevel and extractTimestamp', () => {
    expect(extractLevel(errorLine)).toBe(LogLevels.error)
    expect(extractLevel(infoLine)).toBe(LogLevels.info)
    expect(extractLevel('[2026-09-29T10:00:00.000] [FATAL] arena - x')).toBe(LogLevels.error)
    expect(extractLevel('[2026-09-29T10:00:00.000] [TRACE] arena - x')).toBe(LogLevels.debug)
    expect(extractLevel(stackLine)).toBeNull()
    expect(extractTimestamp(infoLine)).toBe('2026-09-29T10:00:01.000')
    expect(extractTimestamp(stackLine)).toBeNull()
  })

  test('parser: unique ids, level and timestamp inherited per instance', () => {
    const parser = createLogLinesParser()
    const first = parser.parse('A', [stackLine, errorLine, stackLine])
    const other = parser.parse('B', [stackLine])
    const second = parser.parse('A', [stackLine, infoLine])
    expect(first.map((line) => line.level)).toEqual([null, LogLevels.error, LogLevels.error])
    expect(first.map((line) => line.timestamp)).toEqual(['', '2026-09-29T10:00:00.000', '2026-09-29T10:00:00.000'])
    expect(other[0]).toMatchObject({ instanceId: 'B', level: null, timestamp: '' })
    expect(second.map((line) => line.level)).toEqual([LogLevels.error, LogLevels.info])
    const marker = parser.createMarker({ instanceId: 'A', marker: LogMarkers.rotated })
    expect(marker.timestamp).toBe('2026-09-29T10:00:01.000')
    const ids = [...first, ...other, ...second, marker].map((line) => line.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('mergeLines sorts lines of different instances by timestamp', () => {
    const parser = createLogLinesParser()
    const linesA = parser.parse('A', [logLine(1, 'a1'), logLine(3, 'a3'), stackLine, logLine(5, 'a5')])
    const linesB = parser.parse('B', [logLine(2, 'b2'), logLine(3, 'b3'), logLine(6, 'b6')])
    const merged = mergeLines(linesA, linesB)
    expect(texts(merged)).toEqual([
      logLine(1, 'a1'),
      logLine(2, 'b2'),
      logLine(3, 'a3'),
      stackLine,
      logLine(3, 'b3'),
      logLine(5, 'a5'),
      logLine(6, 'b6'),
    ])
    // more recent lines are appended
    const newer = parser.parse('A', [logLine(7, 'a7')])
    expect(texts(mergeLines(merged, newer)).at(-1)).toBe(logLine(7, 'a7'))
    expect(mergeLines(merged, [])).toBe(merged)
  })

  test('appendLines keeps only the last maxLines lines', () => {
    const parser = createLogLinesParser()
    const lines = parser.parse('A', ['a', 'b', 'c'])
    const newLines = parser.parse('A', ['d', 'e'])
    expect(texts(appendLines(lines, newLines, 10))).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(texts(appendLines(lines, newLines, 3))).toEqual(['c', 'd', 'e'])
    expect(appendLines(lines, [], 10)).toBe(lines)
    expect(texts(appendLines(lines, [], 2))).toEqual(['b', 'c'])
  })

  test('removeInstanceLines', () => {
    const parser = createLogLinesParser()
    const lines = mergeLines(parser.parse('A', [logLine(1, 'a')]), parser.parse('B', [logLine(2, 'b')]))
    expect(texts(removeInstanceLines(lines, 'A'))).toEqual([logLine(2, 'b')])
    expect(removeInstanceLines(lines, 'C')).toBe(lines)
  })

  test('filterLines', () => {
    const parser = createLogLinesParser()
    const lines = [
      ...parser.parse('A', [errorLine, stackLine, infoLine, debugLine]),
      parser.createMarker({ instanceId: 'A', marker: LogMarkers.rotated }),
      ...parser.parse('B', [debugLine]),
    ]

    expect(filterLines(lines, { text: '', levels: allLogLevels })).toBe(lines)

    const errorsOnly = filterLines(lines, { text: '', levels: [LogLevels.error] })
    expect(texts(errorsOnly)).toEqual([errorLine, stackLine, ''])

    const byText = filterLines(lines, { text: 'SERVER', levels: allLogLevels })
    expect(texts(byText)).toEqual([stackLine, infoLine, ''])

    const onlyB = filterLines(lines, { text: '', levels: allLogLevels, excludedInstanceIds: ['A'] })
    expect(onlyB.map((line) => line.instanceId)).toEqual(['B'])
  })
})
