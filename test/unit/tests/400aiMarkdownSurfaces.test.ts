import fs from 'node:fs'
import path from 'node:path'

const read = (file: string): string => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')

// every place that renders model output as Markdown (the plain Markdown component loads remote images)
const surfaces = [
  'webapp/components/ai/AiExplainPanel/AiExplainPanel.js',
  'webapp/components/ai/AiActivityLogSummaryModal/AiActivityLogSummaryModal.js',
  'webapp/components/ai/Assistant/AssistantMessage.tsx',
]

describe('AI Markdown surfaces (400)', () => {
  test.each(surfaces)('%s renders the model output through AssistantMarkdown only', (file) => {
    const source = read(file)
    expect(source).not.toMatch(/@webapp\/components\/markdown['"]/)
    expect(source).toMatch(/AssistantMarkdown/)
  })
})
