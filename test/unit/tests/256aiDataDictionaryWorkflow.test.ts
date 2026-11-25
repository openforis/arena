import { isGatewayFeature } from '@common/ai/features'
import { AiLimits } from '@common/ai/limits'
import { buildDataDictionaryPrompt } from '@common/ai/prompts/dataDictionary'
import SystemError from '@core/systemError'
import { mockAnswerFor } from '@server/modules/ai/service/mockProvider'
import {
  cleanAiDescription,
  generateDataDictionaryWorkflow,
  runDataDictionaryDescriptions,
} from '@webapp/ai/workflows/dataDictionary'

const nodeDef = (uuid: string) => ({ uuid, name: `name_${uuid}`, type: 'decimal', parentPath: 'plot' })
const nodeDefs = (count: number) => Array.from({ length: count }, (_v, i) => nodeDef(`u${i}`))
const generateText = async () => ''
const noGuard = async () => {}
const maxChars = AiLimits.dataDictionaryMaxDescriptionChars

describe('data dictionary in the browser (256)', () => {
  test("keeps only the batch's node defs, trims, truncates and counts the missing ones", async () => {
    const sizes: number[] = []
    let call = 0
    const progress: unknown[] = []
    const { aiDescriptions, failedCount } = await runDataDictionaryDescriptions({
      items: { surveyName: 'forest', nodeDefs: nodeDefs(25) },
      generateText,
      guard: noGuard,
      onProgress: (value) => progress.push(value),
      describe: async ({ nodeDefs: batch }: any) => {
        call += 1
        sizes.push(batch.length)
        if (call === 2) throw new Error('fetch failed')
        const descriptions = batch.map(({ uuid }: any) => ({ uuid, description: 'D.' }))
        if (call === 1) {
          descriptions[0].description = '  The first.  '
          descriptions[1].description = '   '
          descriptions.push({ uuid: 'foreign', description: 'Not asked for.' })
        }
        if (call === 3) descriptions[0].description = 'x'.repeat(maxChars + 50)
        return { descriptions }
      },
    })
    expect(sizes).toEqual([10, 10, 5])
    expect(aiDescriptions.u0).toBe('The first.')
    expect(aiDescriptions.u1).toBeUndefined()
    expect(aiDescriptions.foreign).toBeUndefined()
    expect(aiDescriptions.u20).toHaveLength(maxChars)
    expect(aiDescriptions.u20.endsWith('…')).toBe(true)
    // batch 2 failed (10) and u1 came back blank (1)
    expect(Object.keys(aiDescriptions)).toHaveLength(14)
    expect(failedCount).toBe(11)
    expect(progress.at(-1)).toEqual({ done: 3, total: 3 })
  })

  test('an unusable answer splits the call in halves; a single node def that still fails is counted', async () => {
    const sizes: number[] = []
    const { aiDescriptions, failedCount, notDoneCount } = await runDataDictionaryDescriptions({
      items: { surveyName: 'forest', nodeDefs: nodeDefs(4) },
      generateText,
      guard: noGuard,
      describe: async ({ nodeDefs: batch }: any) => {
        sizes.push(batch.length)
        // the whole batch and the half with u2 are cut off; u2 alone fails too
        if (batch.length > 1 && batch.some(({ uuid }: any) => uuid === 'u2')) {
          throw new SystemError('aiDataDictionaryInvalid', {}, 502)
        }
        if (batch.length === 1 && batch[0].uuid === 'u2') throw new SystemError('aiDataDictionaryInvalid', {}, 502)
        return { descriptions: batch.map(({ uuid }: any) => ({ uuid, description: 'D.' })) }
      },
    })
    expect(sizes).toEqual([4, 2, 2, 1, 1])
    expect(Object.keys(aiDescriptions).sort((a, b) => a.localeCompare(b))).toEqual(['u0', 'u1', 'u3'])
    expect(failedCount).toBe(1)
    expect(notDoneCount).toBe(0)
  })

  test('node defs a stop kept from being tried are not done, not failed', async () => {
    const controller = new AbortController()
    const { failedCount, notDoneCount, stop } = await runDataDictionaryDescriptions({
      items: { surveyName: 'forest', nodeDefs: nodeDefs(25) },
      generateText,
      guard: noGuard,
      signal: controller.signal,
      describe: async ({ nodeDefs: batch }: any) => {
        controller.abort()
        return { descriptions: batch.map(({ uuid }: any) => ({ uuid, description: 'D.' })) }
      },
    })
    expect(stop?.cause).toBe('cancelled')
    expect(failedCount).toBe(0)
    expect(notDoneCount).toBe(15)
  })

  test('at most AiLimits.dataDictionaryMaxDescriptions node defs are sent', async () => {
    let sent = 0
    await runDataDictionaryDescriptions({
      items: { surveyName: 'forest', nodeDefs: nodeDefs(205) },
      generateText,
      guard: noGuard,
      describe: async ({ nodeDefs: batch }: any) => {
        sent += batch.length
        return { descriptions: [] }
      },
    })
    expect(sent).toBe(AiLimits.dataDictionaryMaxDescriptions)
  })

  test('cleanAiDescription', () => {
    expect(cleanAiDescription('  A field.  ')).toBe('A field.')
    expect(cleanAiDescription(3)).toBe('')
    expect(cleanAiDescription('abcdef', 4)).toBe('abc…')
  })

  test('no node def without a description: nothing is sent and nothing fails', async () => {
    const result = await generateDataDictionaryWorkflow({
      surveyId: 1,
      cycle: '0',
      fetchAiItems: async () => ({ surveyName: 'forest', nodeDefs: [] }),
    })
    expect(result).toEqual({ aiDescriptions: {}, failedCount: 0, notDoneCount: 0 })
  })

  test('the data dictionary goes through the gateway', () => {
    expect(isGatewayFeature('dataDictionary')).toBe(true)
  })

  test('the mock provider describes every requested field (e2e)', () => {
    const { system, prompt } = buildDataDictionaryPrompt({
      surveyName: 'forest',
      nodeDefs: [
        { ...nodeDef('u1'), id: '1' },
        { ...nodeDef('u2'), id: '2' },
      ],
    })
    const answer = mockAnswerFor([
      { role: 'system', content: system },
      { role: 'user', content: [{ type: 'text', text: prompt }] },
    ] as any)
    expect(JSON.parse(answer)).toEqual({
      descriptions: [
        { id: '1', description: 'MOCK description.' },
        { id: '2', description: 'MOCK description.' },
      ],
    })
  })

  test('the prompt gives the label of a field (it explains abbreviated names)', () => {
    const { prompt } = buildDataDictionaryPrompt({
      surveyName: 'forest',
      nodeDefs: [{ id: '1', name: 'rp', label: 'Reference point', type: 'text' }],
    })
    expect(prompt).toContain('id="1" name="rp" label="Reference point" type="text"')
  })
})
