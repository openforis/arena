import { getFileNameFromContentDisposition } from '@webapp/utils/contentDispositionUtils'

describe('getFileNameFromContentDisposition', () => {
  it('prefers the encoded filename* parameter', () => {
    expect(
      getFileNameFromContentDisposition(`attachment; filename="f_rest, 1.png"; filename*=UTF-8''f%C3%B4rest%2C%201.png`)
    ).toBe('fôrest, 1.png')
  })

  it('reads a quoted file name', () => {
    expect(getFileNameFromContentDisposition('attachment; filename="my logo, 1.png"')).toBe('my logo, 1.png')
  })

  it('reads an unquoted file name', () => {
    expect(getFileNameFromContentDisposition('attachment; filename=logo.png')).toBe('logo.png')
  })

  it('falls back to the plain file name when filename* cannot be decoded', () => {
    expect(getFileNameFromContentDisposition(`attachment; filename="logo.png"; filename*=UTF-8''%E0%A4%A`)).toBe(
      'logo.png'
    )
  })

  it('returns null when the header or the file name is missing', () => {
    expect(getFileNameFromContentDisposition(undefined)).toBeNull()
    expect(getFileNameFromContentDisposition('inline')).toBeNull()
  })
})
