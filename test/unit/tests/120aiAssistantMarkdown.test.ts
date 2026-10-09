import { execFileSync } from 'node:child_process'
import path from 'node:path'

// jsdom (behind isomorphic-dompurify) is ESM-only and Jest can't load it: the renderer runs in a Node child process
// (Node strips the types natively; the module has no path aliases)
const modulePath = path.resolve(process.cwd(), 'webapp/components/ai/Assistant/assistantMarkdown.ts')

const script = `
const { renderAssistantMarkdown } = await import(${JSON.stringify(`file://${modulePath}`)})
const { default: DOMPurify } = await import('isomorphic-dompurify')
const inputs = JSON.parse(process.argv[1])
const outputs = inputs.map(renderAssistantMarkdown)
const shared = DOMPurify.sanitize('<a href="https://example.org">a</a>')
process.stdout.write(JSON.stringify({ outputs, shared }))
`

const render = (...sources: string[]): { outputs: string[]; shared: string } =>
  JSON.parse(
    execFileSync(process.execPath, ['--no-warnings', '--input-type=module', '-e', script, JSON.stringify(sources)], {
      encoding: 'utf8',
      cwd: process.cwd(),
    })
  )

const rawPayload = [
  '<img src="https://evil/?q=1" srcset="https://evil/2 2x">',
  '<p style="background:url(https://evil/3)">text</p>',
  '<iframe src="https://evil/4"></iframe>',
  '<video src="https://evil/5" poster="https://evil/6"></video>',
  '<audio src="https://evil/7"></audio>',
  '<svg><image href="https://evil/8"/></svg>',
  '<link rel="stylesheet" href="https://evil/9">',
].join('\n')

describe('renderAssistantMarkdown', () => {
  const { outputs, shared } = render(
    '![x](https://evil/?q=schema)',
    rawPayload,
    '[a](https://example.org) [b](javascript:alert(1)) <script>alert(1)</script>',
    '**bold** and `code`\n\n- one\n- two'
  )

  test('a Markdown image loads nothing: it becomes a link', () => {
    expect(outputs[0]).not.toMatch(/<img/i)
    expect(outputs[0]).toContain('<a href="https://evil/?q=schema"')
    expect(outputs[0]).toContain('>x</a>')
  })

  test('raw remote-loading elements and attributes are dropped', () => {
    expect(outputs[1]).not.toMatch(/<(img|iframe|video|audio|svg|image|link|source)/i)
    expect(outputs[1]).not.toMatch(/srcset|style=|poster|src=/i)
    expect(outputs[1]).toContain('text')
  })

  test('links open in a new tab with noopener noreferrer; scripts and javascript: urls are removed', () => {
    expect(outputs[2]).toContain('<a href="https://example.org" target="_blank" rel="noopener noreferrer">a</a>')
    expect(outputs[2]).not.toMatch(/javascript:|<script/i)
  })

  test('ordinary formatting is kept', () => {
    expect(outputs[3]).toContain('<strong>bold</strong>')
    expect(outputs[3]).toContain('<code>code</code>')
    expect(outputs[3]).toContain('<li>one</li>')
  })

  test('the sanitizer hook does not leak to the shared sanitizer', () => {
    expect(shared).toBe('<a href="https://example.org">a</a>')
  })
})
