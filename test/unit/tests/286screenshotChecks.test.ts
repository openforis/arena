import {
  checkScreenshotSize,
  DEFAULT_MAX_FILE_SIZE_MB,
  getAvailableSpaceBytes,
  getEffectiveMaxFileSizeMb,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotChecks'

const MB = 1024 * 1024

describe('Screenshot size checks (286)', () => {
  test('accepts an image within the attribute limit and the free space', () => {
    expect(checkScreenshotSize({ sizeBytes: 2 * MB, maxFileSizeMb: 5, availableSpaceBytes: 3 * MB })).toEqual({
      ok: true,
    })
  })

  test('refuses an image above the attribute max file size, with the sizes for the message', () => {
    expect(checkScreenshotSize({ sizeBytes: 10.5 * MB, maxFileSizeMb: 10, availableSpaceBytes: null })).toEqual({
      ok: false,
      reason: 'maxFileSize',
      sizeMb: 10.5,
      limitMb: 10,
    })
  })

  test('uses the default limit when the attribute has none or an invalid one', () => {
    expect(getEffectiveMaxFileSizeMb(undefined)).toBe(DEFAULT_MAX_FILE_SIZE_MB)
    expect(getEffectiveMaxFileSizeMb(null)).toBe(DEFAULT_MAX_FILE_SIZE_MB)
    expect(getEffectiveMaxFileSizeMb(0)).toBe(DEFAULT_MAX_FILE_SIZE_MB)
    expect(getEffectiveMaxFileSizeMb(Number.NaN)).toBe(DEFAULT_MAX_FILE_SIZE_MB)
    expect(getEffectiveMaxFileSizeMb(2)).toBe(2)
    expect(checkScreenshotSize({ sizeBytes: 11 * MB, maxFileSizeMb: 0 })).toMatchObject({ ok: false, limitMb: 10 })
  })

  test('refuses an image above the free space of the survey; equal is fine', () => {
    expect(checkScreenshotSize({ sizeBytes: 2000, maxFileSizeMb: 10, availableSpaceBytes: 1999 })).toEqual({
      ok: false,
      reason: 'quota',
    })
    expect(checkScreenshotSize({ sizeBytes: 2000, maxFileSizeMb: 10, availableSpaceBytes: 2000 })).toEqual({
      ok: true,
    })
  })

  test('skips the quota check when the free space is unknown', () => {
    expect(checkScreenshotSize({ sizeBytes: 2000, maxFileSizeMb: 10, availableSpaceBytes: null })).toEqual({
      ok: true,
    })
    expect(getAvailableSpaceBytes({})).toBeNull()
    expect(getAvailableSpaceBytes(null)).toBeNull()
    expect(getAvailableSpaceBytes({ availableSpace: 1234 })).toBe(1234)
  })
})
