import { checkTextHasLinks } from '@core/markdownUtils'

describe('MarkdownUtils: checkTextHasLinks', () => {
  describe('should return false when text has no links', () => {
    test.each([
      ['plain text without links', 'This is plain text without any links'],
      ['empty string', ''],
      ['text with square brackets but no link', 'This text has [brackets] but no actual link'],
      ['incomplete markdown link syntax', 'This has [incomplete link syntax'],
      ['URL-like text without markdown syntax', 'Visit https://example.com for more info'],
      [
        'text with multiple paragraphs and no links',
        `First paragraph.

Second paragraph.

Third paragraph.`,
      ],
      ['code blocks containing URLs', '`https://example.com`'],
      [
        'multiline text without links',
        `Line 1
Line 2
Line 3`,
      ],
      [
        'complex markdown without links',
        `# Title

This is a paragraph with **bold text** and *italic text*.

- List item 1
- List item 2
- List item 3

> A quote

Another paragraph.`,
      ],
    ])('%s', (_description, text) => {
      expect(checkTextHasLinks(text)).toBe(false)
    })
  })

  describe('should return true when text has links', () => {
    test.each([
      ['markdown link syntax', 'Check out [this link](https://example.com)'],
      ['multiple markdown links', 'Visit [Google](https://google.com) or [GitHub](https://github.com)'],
      ['link at the beginning of text', '[Click here](https://example.com) to learn more'],
      ['link at the end of text', 'For more information visit [our website](https://example.com)'],
      [
        'links in nested structures (lists)',
        `- Item 1
- Item 2 with [link](https://example.com)
- Item 3`,
      ],
      ['links in headings', '## Heading with [link](https://example.com)'],
      ['links in bold text', '**Check out [this link](https://example.com)**'],
      ['links in italic text', '*Visit [our site](https://example.com) for details*'],
      ['links with title attributes', '[Link](https://example.com "Title")'],
      [
        'reference-style links',
        `Check out [this link][ref]

[ref]: https://example.com`,
      ],
      ['autolinks', 'Visit <https://example.com> for details'],
      ['email autolinks', 'Contact us at <user@example.com>'],
      ['links in blockquotes', '> Quote with [link](https://example.com)'],
      [
        'complex markdown with nested links',
        `# Title

This is a paragraph with **bold text** and *italic text*.

- List item 1
- List item 2 with [link](https://example.com)
- List item 3

> A quote

Another paragraph.`,
      ],
      ['image links (treated as links)', '![Alt text](https://example.com/image.png)'],
      ['link with special characters in URL', '[Link](https://example.com/path?query=value&other=123#anchor)'],
      ['relative links', '[Link](/relative/path)'],
    ])('%s', (_description, text) => {
      expect(checkTextHasLinks(text)).toBe(true)
    })
  })
})
