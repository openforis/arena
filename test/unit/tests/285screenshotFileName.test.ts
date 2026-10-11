import {
  buildScreenshotFileName,
  ensurePngFileName,
  formatIsoDate,
  sanitizeFileNamePart,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotFileName'

const date = new Date(2026, 9, 11, 9, 30)

describe('Screenshot file name (285)', () => {
  test('formats the local date as yyyy-mm-dd', () => {
    expect(formatIsoDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(formatIsoDate(date)).toBe('2026-10-11')
  })

  test('builds the name from the entity name, the plot keys and the date', () => {
    expect(buildScreenshotFileName({ entityName: 'cluster', keys: ['2'], date })).toBe('cluster_2_2026-10-11.png')
    expect(buildScreenshotFileName({ entityName: 'plot', keys: [12, 3], date })).toBe('plot_12_3_2026-10-11.png')
  })

  test('replaces slashes, spaces and dots at the edges, keeps Cyrillic letters', () => {
    expect(buildScreenshotFileName({ entityName: 'участок', keys: ['A/B 1', ' x '], date })).toBe(
      'участок_A_B_1_x_2026-10-11.png'
    )
    expect(buildScreenshotFileName({ entityName: 'cluster', keys: ['../x'], date })).toBe('cluster_x_2026-10-11.png')
  })

  test('falls back to "map" when the entity name and the keys are empty', () => {
    expect(buildScreenshotFileName({ entityName: '', keys: ['', null, '  '], date })).toBe('map_2026-10-11.png')
    expect(buildScreenshotFileName({ date })).toBe('map_2026-10-11.png')
  })

  test('caps long names and keeps the date', () => {
    const name = buildScreenshotFileName({ entityName: 'plot', keys: ['k'.repeat(300)], date })
    expect(name.endsWith('_2026-10-11.png')).toBe(true)
    expect(Array.from(name).length).toBeLessThanOrEqual(104)
  })

  test('normalizes a typed file name', () => {
    expect(ensurePngFileName(' site map.PNG ')).toBe('site_map.png')
    expect(ensurePngFileName('a/b\\c')).toBe('a_b_c.png')
    expect(ensurePngFileName('   ')).toBe('')
    expect(ensurePngFileName('///')).toBe('')
  })

  test('sanitizes a name part', () => {
    expect(sanitizeFileNamePart('__a  b__')).toBe('a_b')
    expect(sanitizeFileNamePart('-.x.-')).toBe('x')
  })
})
