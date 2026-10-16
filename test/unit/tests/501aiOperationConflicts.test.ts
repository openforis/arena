import * as Survey from '@core/survey/survey'

import type { ChangeSet } from '@webapp/ai/changeSets/types'
import { nodeDefProposeUpdateTool } from '@webapp/ai/tools/design/nodeDefProposeUpdate'
import { runTool } from '@webapp/ai/tools/registry'
import {
  getConflictingOperationIds,
  getOperationConflicts,
  isCardStale,
} from '@webapp/components/ai/Assistant/changeSetCardModel'
import { createToolContext } from '@test/unit/utils/assistantTestUtils'
import { buildRefSurvey } from '@test/unit/utils/designSuggestionTestUtils'

const publish = (target: any): any =>
  Survey.getNodeDefsArray(target).reduce(
    (acc: any, nodeDef: any) => Survey.assocNodeDef({ nodeDef: { ...nodeDef, published: true } })(acc),
    target
  )

describe('operation conflicts of a card (501)', () => {
  let survey: any
  let changeSet: ChangeSet

  beforeAll(async () => {
    survey = await buildRefSurvey()
    const ctx = createToolContext({ survey })
    await runTool(
      nodeDefProposeUpdateTool,
      { summary: 'Assign', changes: [{ nodeDefName: 'region', prop: 'categoryName', value: 'land_use' }] },
      ctx
    )
    changeSet = ctx.changeSets[0] as ChangeSet
  })

  test('a category change proposed before publishing keeps its refEditDisabled reason with params', () => {
    const [operation] = changeSet.operations
    expect(getOperationConflicts({ cardState: { changeSet }, survey })).toEqual([])
    expect(getOperationConflicts({ cardState: { changeSet }, survey: publish(survey) })).toEqual([
      { id: operation.id, reason: 'aiAssistant.issues.refEditDisabled', params: { name: 'region' } },
    ])
  })

  test('the ids and the stale flag come from the same conflicts', () => {
    const published = publish(survey)
    expect(getConflictingOperationIds({ cardState: { changeSet }, survey: published })).toEqual([
      changeSet.operations[0].id,
    ])
    expect(isCardStale({ cardState: { changeSet }, survey: published })).toBe(true)
    expect(isCardStale({ cardState: { changeSet }, survey })).toBe(false)
  })

  test('a discarded card or an applied operation has no conflict', () => {
    const published = publish(survey)
    expect(getOperationConflicts({ cardState: { changeSet, discarded: true }, survey: published })).toEqual([])
    expect(
      getOperationConflicts({
        cardState: { changeSet, results: [{ id: changeSet.operations[0].id, status: 'applied' }] },
        survey: published,
      })
    ).toEqual([])
  })
})
