import formatDuration from '@webapp/views/App/JobMonitor/JobTiming/formatDuration'

describe('formatDuration', () => {
  test('returns null for 0', () => expect(formatDuration(0)).toBeNull())
  test('returns null for negative values', () => expect(formatDuration(-100)).toBeNull())
  test('formats seconds only', () => expect(formatDuration(23000)).toBe('23s'))
  test('formats 1 second', () => expect(formatDuration(1000)).toBe('1s'))
  test('formats minutes and seconds', () => expect(formatDuration(83000)).toBe('1m 23s'))
  test('formats exact minutes (0 seconds shown)', () => expect(formatDuration(120000)).toBe('2m 0s'))
  test('formats hours and minutes', () => expect(formatDuration(3720000)).toBe('1h 2m'))
  test('formats exact hours (0 minutes shown)', () => expect(formatDuration(3600000)).toBe('1h 0m'))
  test('ignores sub-second precision', () => expect(formatDuration(23999)).toBe('23s'))
})
