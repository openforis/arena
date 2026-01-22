import { checkTextHasLinks } from '@core/markdownUtils'

describe('MarkdownUtils: checkTextHasLinks', () => {
  test('should return false for plain text without links', () => {
    const text = 'This is plain text without any links'
    expect(checkTextHasLinks(text)).toBe(false)
  })

  test('should return false for empty string', () => {
    expect(checkTextHasLinks('')).toBe(false)
  })

  test('should return true for markdown link syntax', () => {
    const text = 'Check out [this link](https://example.com)'
    expect(checkTextHasLinks(text)).toBe(true)
  })

  test('should return true for multiple markdown links', () => {
    const text = 'Visit [Google](https://google.com) or [GitHub](https://github.com)'
    expect(checkTextHasLinks(text)).toBe(true)
  })

  test('should return true for link at the beginning of text', () => {
    const text = '[Click here](https://example.com) to learn more'
    expect(checkTextHasLinks(text)).toBe(true)
  })

  test('should return true for link at the end of text', () => {
    const text = 'For more information visit [our website](https://example.com)'
    expect(checkTextHasLinks(text)).toBe(true)
  })

  test('should return false for text with square brackets but no link', () => {
    const text = 'This text has [brackets] but no actual link'
    expect(checkTextHasLinks(text)).toBe(false)
  })

  test('should return false for incomplete markdown link syntax', () => {
    const text = 'This has [incomplete link syntax'
    expect(checkTextHasLinks(text)).toBe(false)
  })

  test('should return true for links in nested structures (lists)', () => {
    const text = `- Item 1
- Item 2 with [link](https://example.com)
- Item 3`
    expect(checkTextHasLinks(text)).toBe(true)
  })

  test('should return true for links in headings', () => {
    const text = '## Heading with [link](https://example.com)'
    expect(checkTextHasLinks(text)).toBe(true)
  })

  test('should return true for links in bold text', () => {
    const text = '**Check out [this link](https://example.com)**'
    expect(checkTextHasLinks(text)).toBe(true)
  })

  test('should return true for links in italic text', () => {
    const text = '*Visit [our site](https://example.com) for details*'
    expect(checkTextHasLinks(text)).toBe(true)
  })

  test('should return true for links with title attributes', () => {
    const text = '[Link](https://example.com "Title")'
    expect(checkTextHasLinks(text)).toBe(true)
  })

  test('should return true for reference-style links', () => {
    const text = `Check out [this link][ref]

[ref]: https://example.com`
    expect(checkTextHasLinks(text)).toBe(true)
  })

  test('should return false for URL-like text without markdown syntax', () => {
    const text = 'Visit https://example.com for more info'
    expect(checkTextHasLinks(text)).toBe(false)
  })

  test('should return true for autolinks', () => {
    const text = 'Visit <https://example.com> for details'
    expect(checkTextHasLinks(text)).toBe(true)
  })

  test('should return true for email autolinks', () => {
    const text = 'Contact us at <user@example.com>'
    expect(checkTextHasLinks(text)).toBe(true)
  })

  test('should return false for text with multiple paragraphs and no links', () => {
    const text = `First paragraph.

Second paragraph.

Third paragraph.`
    expect(checkTextHasLinks(text)).toBe(false)
  })

  test('should return true for links in blockquotes', () => {
    const text = '> Quote with [link](https://example.com)'
    expect(checkTextHasLinks(text)).toBe(true)
  })

  test('should return true for complex markdown with nested links', () => {
    const text = `# Title

This is a paragraph with **bold text** and *italic text*.

- List item 1
- List item 2 with [link](https://example.com)
- List item 3

> A quote

Another paragraph.`
    expect(checkTextHasLinks(text)).toBe(true)
  })

  test('should return false for complex markdown without links', () => {
    const text = `# Title

This is a paragraph with **bold text** and *italic text*.

- List item 1
- List item 2
- List item 3

> A quote

Another paragraph.`
    expect(checkTextHasLinks(text)).toBe(false)
  })

  test('should return true for image links (treated as links)', () => {
    const text = '![Alt text](https://example.com/image.png)'
    expect(checkTextHasLinks(text)).toBe(true)
  })

  test('should return false for code blocks containing URLs', () => {
    const text = '`https://example.com`'
    expect(checkTextHasLinks(text)).toBe(false)
  })

  test('should return true for link with special characters in URL', () => {
    const text = '[Link](https://example.com/path?query=value&other=123#anchor)'
    expect(checkTextHasLinks(text)).toBe(true)
  })

  test('should return true for relative links', () => {
    const text = '[Link](/relative/path)'
    expect(checkTextHasLinks(text)).toBe(true)
  })

  test('should return false for multiline text without links', () => {
    const text = `Line 1
Line 2
Line 3`
    expect(checkTextHasLinks(text)).toBe(false)
  })
})
