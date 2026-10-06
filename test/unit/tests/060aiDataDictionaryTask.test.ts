import { generateDataDictionaryDescriptions } from '@common/ai/tasks/dataDictionary'
import { expectSystemErrorKey, scriptedTextGenerator } from '@test/unit/utils/aiTestUtils'

const nodeDefs = [{ uuid: 'u1', name: 'tree_dbh', type: 'decimal', parentPath: 'cluster/plot/tree' }]
const validAnswer = JSON.stringify({ descriptions: [{ uuid: 'u1', description: 'Diameter at breast height.' }] })

describe('generateDataDictionaryDescriptions', () => {
  test('returns the parsed descriptions', async () => {
    const { generateText, calls } = scriptedTextGenerator(validAnswer)
    const result = await generateDataDictionaryDescriptions({ generateText, surveyName: 's', nodeDefs })
    expect(result.descriptions).toEqual([{ uuid: 'u1', description: 'Diameter at breast height.' }])
    expect(calls[0].prompt).toMatch(/tree_dbh/)
  })

  test('retries once, then fails with aiDataDictionaryInvalid', async () => {
    const { generateText, calls } = scriptedTextGenerator('bad', 'still bad')
    await expectSystemErrorKey(
      generateDataDictionaryDescriptions({ generateText, surveyName: 's', nodeDefs }),
      'aiDataDictionaryInvalid'
    )
    expect(calls).toHaveLength(2)
  })
})
