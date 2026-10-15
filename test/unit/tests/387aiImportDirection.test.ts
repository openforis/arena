import fs from 'fs'
import path from 'path'

import { mergeOperationResults } from '@webapp/ai/changeSets/operationResults'
import { mergeOperationResults as mergeFromCardModel } from '@webapp/ai/changeSets/recordEdits/recordEditCardModel'
import { mergeOperationResults as mergeFromPanelModel } from '@webapp/components/ai/Assistant/assistantPanelModel'

const aiDir = path.resolve(__dirname, '../../../webapp/ai')

const sourceFiles = (dir: string): string[] =>
  fs
    .readdirSync(path.join(aiDir, dir), { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.tsx?$/.test(file))
    .map((file) => path.join(dir, file))

describe('imports point from the UI to webapp/ai, not the other way (387)', () => {
  test.each(['changeSets', 'tools', 'agent'])('webapp/ai/%s does not import from the UI components', (dir) => {
    const offenders = sourceFiles(dir).filter((file) =>
      /(from|import)\s+['"]@webapp\/(components|views)\//.test(fs.readFileSync(path.join(aiDir, file), 'utf8'))
    )
    expect(offenders).toEqual([])
  })

  test('the card models and the panel share one merge of operation results', () => {
    expect(mergeFromCardModel).toBe(mergeOperationResults)
    expect(mergeFromPanelModel).toBe(mergeOperationResults)
    const merged = mergeOperationResults(
      [
        { id: 'a', status: 'failed' },
        { id: 'b', status: 'applied' },
      ],
      [{ id: 'a', status: 'applied' }]
    )
    expect(merged).toEqual([
      { id: 'a', status: 'applied' },
      { id: 'b', status: 'applied' },
    ])
  })
})
