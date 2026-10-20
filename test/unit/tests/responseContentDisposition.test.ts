import * as Response from '@server/utils/response'

type MockRes = {
  headers: Record<string, unknown>
  setHeader: (name: string, value: unknown) => void
  set: (name: string, value: unknown) => void
}

const mockRes = (): MockRes => {
  const headers: Record<string, unknown> = {}
  const setHeader = (name: string, value: unknown) => {
    headers[name] = value
  }
  return { headers, setHeader, set: setHeader }
}

const getContentDisposition = (fileName: string): string => {
  const res = mockRes()
  Response.setContentTypeFile({ res, fileName })
  return String(res.headers['Content-Disposition'])
}

describe('Response.setContentTypeFile', () => {
  // Chromium rejects the whole response when an unquoted filename contains commas
  it('quotes file names containing commas and spaces', () => {
    expect(getContentDisposition('ChatGPT Image Oct 1, 2026, 01_19_59 PM.png')).toBe(
      `attachment; filename="ChatGPT Image Oct 1, 2026, 01_19_59 PM.png"; filename*=UTF-8''ChatGPT%20Image%20Oct%201%2C%202026%2C%2001_19_59%20PM.png`
    )
  })

  it('keeps simple file names readable', () => {
    expect(getContentDisposition('logo.png')).toBe(`attachment; filename="logo.png"; filename*=UTF-8''logo.png`)
  })

  it('replaces quotes, backslashes and non-ASCII characters in the fallback file name', () => {
    expect(getContentDisposition('fôrest "A"\\1.png')).toBe(
      `attachment; filename="f_rest _A__1.png"; filename*=UTF-8''f%C3%B4rest%20%22A%22%5C1.png`
    )
  })
})
