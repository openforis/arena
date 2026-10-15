import { execFileSync } from 'node:child_process'
import path from 'node:path'

// same approach as test 120: jsdom is ESM-only, so the renderer runs in a Node child process
const modulePath = path.resolve(process.cwd(), 'webapp/components/ai/Assistant/assistantMarkdown.ts')

const script = `
const { renderAssistantMarkdown } = await import(${JSON.stringify(`file://${modulePath}`)})
const { cases, policy } = JSON.parse(process.argv[1])
process.stdout.write(JSON.stringify(cases.map((source) => renderAssistantMarkdown(source, policy))))
`

const render = (cases: string[], policy: object = {}): string[] =>
  JSON.parse(
    execFileSync(
      process.execPath,
      ['--no-warnings', '--input-type=module', '-e', script, JSON.stringify({ cases, policy })],
      { encoding: 'utf8', cwd: process.cwd() }
    )
  )

const policy = {
  trustedOrigins: ['https://arena.example'],
  trustedPages: ['https://docs.google.com/document/d/DOC1'],
}

describe('assistant Markdown links (401)', () => {
  const outputs = render(
    [
      '[Open report](https://evil.example/path?d=record-values#frag)',
      '[Arena](https://arena.example/app/collect?x=1#y)',
      '[Section](https://docs.google.com/document/d/DOC1/edit#heading=h.abc)',
      '[Other doc](https://docs.google.com/document/d/DOC1evil/edit?x=1)',
      '[Form](https://docs.google.com/forms/d/e/ID/viewform?entry.1=secret)',
      '[Who](https://trusted.example@evil.example/?d=1)',
      '[Mail](mailto:someone@example.org?subject=s&body=record-values)',
      '<https://evil.example/a?d=1>',
      '[evil.example](https://evil.example/x?d=1)',
      '![alt](https://evil.example/pixel.png?d=1)',
      '[Unicode](https://xn--80ak6aa92e.com/?d=1)',
      '[Port](https://evil.example:8443/?d=1)',
      '[Mail](mailto:%E0%A4%A@x.com)',
      '[Mail](mailto:a%20b@x.com)',
      '[Secret](https://evil.example/c2VjcmV0LXJlY29yZC12YWx1ZXM/more/deeper)',
      '[Two](https://evil.example/one/two)',
      '[Long](https://evil.example/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa)',
    ],
    policy
  )

  test('a link to another site shows its host, loses the query string and the fragment, and has a title', () => {
    expect(outputs[0]).toContain('href="https://evil.example/path"')
    expect(outputs[0]).toContain('title="https://evil.example/path"')
    expect(outputs[0]).toContain('>Open report (evil.example/path)</a>')
    expect(outputs[0]).not.toContain('record-values')
    expect(outputs[0]).not.toContain('frag')
  })

  test('Arena links keep their query string and show no host', () => {
    expect(outputs[1]).toContain('href="https://arena.example/app/collect?x=1#y"')
    expect(outputs[1]).toContain('>Arena</a>')
  })

  test('the manual keeps its heading anchor, but only on its own document', () => {
    expect(outputs[2]).toContain('href="https://docs.google.com/document/d/DOC1/edit#heading=h.abc"')
    expect(outputs[3]).toContain('href="https://docs.google.com/document/d/DOC1evil/edit"')
    expect(outputs[3]).toContain('(docs.google.com/document/d/…)')
    // the host of the manual is not trusted as a whole (Google Forms can be prefilled through the query string)
    expect(outputs[4]).toContain('href="https://docs.google.com/forms/d/e/ID/viewform"')
    expect(outputs[4]).not.toContain('secret')
  })

  test('the user info is dropped: the shown host is the real destination', () => {
    expect(outputs[5]).toContain('href="https://evil.example/"')
    // the root path adds nothing to the host
    expect(outputs[5]).toContain('>Who (evil.example)</a>')
    expect(outputs[5]).not.toContain('trusted.example')
  })

  test('mailto links show the address and drop the subject and body', () => {
    expect(outputs[6]).toContain('href="mailto:someone@example.org"')
    expect(outputs[6]).toContain('>Mail (someone@example.org)</a>')
    expect(outputs[6]).not.toContain('record-values')
  })

  test('a link whose text is the address shows the cleaned address as its text', () => {
    expect(outputs[7]).toContain('href="https://evil.example/a"')
    expect(outputs[7]).toContain('>https://evil.example/a</a>')
  })

  test('a label that is the host of a link with a path still shows the path', () => {
    expect(outputs[8]).toContain('>evil.example (evil.example/x)</a>')
  })

  test('an image becomes a link with the same treatment', () => {
    expect(outputs[9]).not.toMatch(/<img/i)
    expect(outputs[9]).toContain('href="https://evil.example/pixel.png"')
    expect(outputs[9]).toContain('>alt (evil.example/pixel.png)</a>')
  })

  test('the shown host is the punycode form and keeps a non-default port', () => {
    expect(outputs[10]).toContain('(xn--80ak6aa92e.com)')
    expect(outputs[11]).toContain('(evil.example:8443)')
  })

  test('a malformed percent sequence in a mailto address does not throw: the raw address is shown', () => {
    expect(outputs[12]).toContain('href="mailto:%E0%A4%A@x.com"')
    expect(outputs[12]).toContain('(%E0%A4%A@x.com)')
    expect(outputs[13]).toContain('(a b@x.com)')
  })

  test('the path of a link to another site is shown trimmed, so data hidden in it is visible', () => {
    expect(outputs[14]).toContain('(evil.example/c2VjcmV0LXJlY29yZC12YWx1…/more/…)')
    expect(outputs[15]).toContain('(evil.example/one/two)')
    expect(outputs[16]).toContain('(evil.example/aaaaaaaaaaaaaaaaaaaaaaaa…)')
  })

  test('without a policy every https link is treated as external', () => {
    const [output] = render(['[Arena](https://arena.example/app?x=1)'])
    expect(output).toContain('href="https://arena.example/app"')
  })

  test('links still open in a new tab with noopener noreferrer', () => {
    expect(outputs[0]).toContain('target="_blank"')
    expect(outputs[0]).toContain('rel="noopener noreferrer"')
  })
})
