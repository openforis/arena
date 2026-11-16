import { generateDataDictionaryDescriptions } from '@common/ai/tasks/dataDictionary'
import { expectSystemErrorKey, scriptedTextGenerator } from '@test/unit/utils/aiTestUtils'

const nodeDefs = [{ uuid: 'u1', name: 'tree_dbh', type: 'decimal', parentPath: 'cluster/plot/tree' }]
const validAnswer = JSON.stringify({ descriptions: [{ id: '1', description: 'Diameter at breast height.' }] })

describe('generateDataDictionaryDescriptions', () => {
  test('returns the parsed descriptions', async () => {
    const { generateText, calls } = scriptedTextGenerator(validAnswer)
    const result = await generateDataDictionaryDescriptions({ generateText, surveyName: 's', nodeDefs })
    expect(result.descriptions).toEqual([{ uuid: 'u1', description: 'Diameter at breast height.' }])
    expect(calls[0].prompt).toMatch(/tree_dbh/)
  })

  test('drops an id the model made up', async () => {
    const answer = JSON.stringify({
      descriptions: [
        { id: '1', description: 'A.' },
        { id: '7', description: 'B.' },
      ],
    })
    const { generateText } = scriptedTextGenerator(answer)
    const result = await generateDataDictionaryDescriptions({ generateText, surveyName: 's', nodeDefs })
    expect(result.descriptions).toEqual([{ uuid: 'u1', description: 'A.' }])
  })

  test('an unusable answer is not repeated: aiDataDictionaryInvalid, one call', async () => {
    const { generateText, calls } = scriptedTextGenerator('bad')
    await expectSystemErrorKey(
      generateDataDictionaryDescriptions({ generateText, surveyName: 's', nodeDefs }),
      'aiDataDictionaryInvalid'
    )
    expect(calls).toHaveLength(1)
  })
})
