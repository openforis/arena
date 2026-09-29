import {
  allLogLevels,
  appendLines,
  createLogLinesParser,
  extractLevel,
  filterLines,
  LogLevels,
  LogMarkers,
} from '@webapp/views/App/views/SystemLogs/systemLogLines'

const errorLine = '[2026-09-29T10:00:00.000] [ERROR] arena - Something failed'
const stackLine = '    at fn (/app/server.js:1:1)'
const infoLine = '[2026-09-29T10:00:01.000] [INFO] arena - Server started'
const debugLine = '[2026-09-29T10:00:02.000] [DEBUG] arena - Query executed'

describe('System log lines', () => {
  test('extractLevel', () => {
    expect(extractLevel(errorLine)).toBe(LogLevels.error)
    expect(extractLevel(infoLine)).toBe(LogLevels.info)
    expect(extractLevel('[2026-09-29T10:00:00.000] [FATAL] arena - x')).toBe(LogLevels.error)
    expect(extractLevel('[2026-09-29T10:00:00.000] [TRACE] arena - x')).toBe(LogLevels.debug)
    expect(extractLevel(stackLine)).toBeNull()
  })

  test('parser: unique ids and level inherited by lines without prefix', () => {
    const parser = createLogLinesParser()
    const first = parser.parse([stackLine, errorLine, stackLine])
    const second = parser.parse([stackLine, infoLine])
    expect(first.map((line) => line.level)).toEqual([null, LogLevels.error, LogLevels.error])
    expect(second.map((line) => line.level)).toEqual([LogLevels.error, LogLevels.info])
    const marker = parser.createMarker(LogMarkers.rotated)
    const ids = [...first, ...second, marker].map((line) => line.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  test('appendLines keeps only the last maxLines lines', () => {
    const parser = createLogLinesParser()
    const lines = parser.parse(['a', 'b', 'c'])
    const newLines = parser.parse(['d', 'e'])
    expect(appendLines(lines, newLines, 10).map((line) => line.text)).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(appendLines(lines, newLines, 3).map((line) => line.text)).toEqual(['c', 'd', 'e'])
    expect(appendLines(lines, [], 10)).toBe(lines)
    expect(appendLines(lines, [], 2).map((line) => line.text)).toEqual(['b', 'c'])
  })

  test('filterLines', () => {
    const parser = createLogLinesParser()
    const lines = [
      ...parser.parse([errorLine, stackLine, infoLine, debugLine]),
      parser.createMarker(LogMarkers.rotated),
    ]

    expect(filterLines(lines, { text: '', levels: allLogLevels })).toBe(lines)

    const errorsOnly = filterLines(lines, { text: '', levels: [LogLevels.error] })
    expect(errorsOnly.map((line) => line.text)).toEqual([errorLine, stackLine, ''])

    const byText = filterLines(lines, { text: 'SERVER', levels: allLogLevels })
    expect(byText.map((line) => line.text)).toEqual([stackLine, infoLine, ''])
  })
})
