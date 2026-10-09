import { addAiDescriptions } from '@server/modules/survey/service/schemaSummary/schemaSummary'

const item = (uuid: string) => ({ uuid, name: `name_${uuid}`, type: 'decimal', _parentPath: 'cluster' })

describe('addAiDescriptions', () => {
  test('fills descriptions per batch, reports progress and counts failed batches', async () => {
    const items = Array.from({ length: 12 }, (_, i) => item(`u${i}`))
    let call = 0
    const generateText = async ({ prompt }) => {
      call += 1
      if (call <= 2) return 'not json' // first batch: both attempts fail
      const uuids = [...prompt.matchAll(/u\d+/g)].map(([uuid]) => uuid)
      return JSON.stringify({ descriptions: [...new Set(uuids)].map((uuid) => ({ uuid, description: `d ${uuid}` })) })
    }
    const progress = []
    const failures = []
    await addAiDescriptions({
      generateText,
      surveyName: 's',
      items,
      processed: 0,
      total: 12,
      onProgress: ({ processed }) => progress.push(processed),
      onBatchFailed: (size) => failures.push(size),
    })
    expect(failures).toEqual([10])
    expect(progress).toEqual([10, 12])
    expect(items[0]['aiDescription']).toBeUndefined()
    expect(items[11]['aiDescription']).toBe('d u11')
  })
})
