import * as NodeDef from '@core/survey/nodeDef'

import { buildChangeSet } from '@webapp/ai/changeSets/buildChangeSet'
import { createProposedNodeDef } from '@webapp/ai/changeSets/newNodeDef'
import type { ChangeOperationDraft } from '@webapp/ai/changeSets/types'
import { nodeDefProposeCreateTool } from '@webapp/ai/tools/design/nodeDefProposeCreate'
import { runTool } from '@webapp/ai/tools/registry'
import { buildCardRows } from '@webapp/components/ai/Assistant/changeSetCardModel'
import { buildReviewItems } from '@webapp/components/ai/Assistant/changeSetReviewModel'
import { buildAssistantSurvey, createToolContext, getDefByName } from '@test/unit/utils/assistantTestUtils'

let survey: any

beforeAll(async () => {
  survey = await buildAssistantSurvey({ languages: ['en', 'fr'] })
})

const rowsOf = (input: object) => {
  const ctx = createToolContext({ survey })
  return runTool(nodeDefProposeCreateTool, { summary: 's', ...input }, ctx).then((result: any) => {
    expect(result.error).toBeUndefined()
    return buildCardRows({ cardState: { changeSet: ctx.changeSets[0] }, survey, lang: 'en' })
  })
}

const detailsOf = (row: any) =>
  (row.details ?? []).map((detail: any) => [detail.titleKey, detail.titleParams, detail.value])

describe('the card of a new node definition lists what it sets (381)', () => {
  test('a plain attribute has no details', async () => {
    const [row] = await rowsOf({ nodeDefs: [{ parentName: 'cluster', type: 'text', name: 'plain' }] })
    expect(row.details ?? []).toEqual([])
  })

  test('key, every other label language and every description', async () => {
    const [row] = await rowsOf({
      nodeDefs: [
        {
          parentName: 'cluster',
          type: 'text',
          name: 'code_text',
          key: true,
          labels: [
            { lang: 'en', text: 'Code' },
            { lang: 'fr', text: 'Code FR' },
          ],
          descriptions: [
            { lang: 'en', text: 'The code' },
            { lang: 'fr', text: 'Le code' },
          ],
        },
      ],
    })
    // the label in the preferred language stays the row's value
    expect(row.to).toEqual({ kind: 'text', text: 'Code' })
    expect(detailsOf(row)).toEqual([
      ['aiAssistant.card.props.key', {}, { kind: 'boolean', value: true }],
      ['aiAssistant.card.label', { lang: 'fr' }, { kind: 'text', text: 'Code FR' }],
      ['aiAssistant.card.description', { lang: 'en' }, { kind: 'text', text: 'The code' }],
      ['aiAssistant.card.description', { lang: 'fr' }, { kind: 'text', text: 'Le code' }],
    ])
  })

  test('multiple is listed when it differs from the default of the type', async () => {
    const rows = await rowsOf({
      nodeDefs: [
        { parentName: 'cluster', type: 'entity', name: 'table_entity' },
        { parentName: 'cluster', type: 'entity', name: 'single_entity', multiple: false },
        { parentName: 'cluster', type: 'integer', name: 'many_numbers', multiple: true },
      ],
    })
    expect(rows.map((row) => detailsOf(row))).toEqual([
      [],
      [['aiAssistant.card.props.multiple', {}, { kind: 'boolean', value: false }]],
      [['aiAssistant.card.props.multiple', {}, { kind: 'boolean', value: true }]],
    ])
  })

  test('a label only in another language than the preferred one is the row value, not repeated', async () => {
    const [row] = await rowsOf({
      nodeDefs: [{ parentName: 'cluster', type: 'text', name: 'fr_only', labels: [{ lang: 'fr', text: 'Seulement' }] }],
    })
    expect(row.to).toEqual({ kind: 'text', text: 'Seulement' })
    expect(row.details ?? []).toEqual([])
  })

  test('read only is listed too (a card can hold it even if the designer refuses it at proposal)', () => {
    const cluster = getDefByName(survey, 'cluster')
    const nodeDef = createProposedNodeDef({ parent: cluster, type: 'text', cycle: '0', name: 'ro', readOnly: true })
    const changeSet = buildChangeSet({
      drafts: [{ type: 'nodeDef.create', nodeDef, parentUuid: NodeDef.getUuid(cluster) }],
      survey,
      summary: 's',
    })
    const [row] = buildCardRows({ cardState: { changeSet }, survey, lang: 'en' })
    expect(detailsOf(row)).toEqual([['aiAssistant.card.props.readOnly', {}, { kind: 'boolean', value: true }]])
  })

  test('the review items carry the details', () => {
    const nodeDef = createProposedNodeDef({
      parent: getDefByName(survey, 'cluster'),
      type: 'text',
      cycle: '0',
      name: 'k',
      key: true,
    })
    const drafts: ChangeOperationDraft[] = [
      { type: 'nodeDef.create', nodeDef, parentUuid: NodeDef.getUuid(getDefByName(survey, 'cluster')) },
    ]
    const changeSet = buildChangeSet({ drafts, survey, summary: 's' })
    const [item] = buildReviewItems({ cardState: { changeSet }, survey, lang: 'en' })
    expect(item.details).toEqual([
      { titleKey: 'aiAssistant.card.props.key', titleParams: {}, value: { kind: 'boolean', value: true } },
    ])
  })

  test('every prop a create can set is shown (a new prop must get a row)', () => {
    const nodeDef = createProposedNodeDef({
      parent: getDefByName(survey, 'cluster'),
      type: 'entity',
      cycle: '0',
      name: 'e',
      labels: { en: 'E' },
      descriptions: { en: 'D' },
      key: true,
      multiple: false,
      readOnly: true,
    })
    // cycles and layout are the designer's defaults, not the proposal's choices
    const shown = new Set(['name', 'labels', 'descriptions', 'key', 'multiple', 'readOnly', 'cycles', 'layout'])
    expect(Object.keys(NodeDef.getProps(nodeDef)).filter((prop) => !shown.has(prop))).toEqual([])
  })
})
