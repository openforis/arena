import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'

import { buildChangeSet } from '@webapp/ai/changeSets/buildChangeSet'
import { createProposedNodeDef } from '@webapp/ai/changeSets/newNodeDef'
import type { ChangeSet } from '@webapp/ai/changeSets/types'
import {
  getDesignAreaStatus,
  getHelpAreaStatus,
  isAssistantShown,
  parseAppPath,
  pickArea,
  type AssistantAreaStatus,
} from '@webapp/components/ai/Assistant/assistantAreas'
import { createAssistantPanelStore } from '@webapp/components/ai/Assistant/assistantPanelStore'
import {
  buildCardRows,
  getNodeDefNavigation,
  getPendingOperationIds,
  isCardStale,
} from '@webapp/components/ai/Assistant/changeSetCardModel'
import { TreeSelectViewMode } from '@webapp/model'
import { buildAssistantSurvey, getDefByName } from '@test/unit/utils/assistantTestUtils'

const location = { hostingClass: 'cloud', provider: 'openai', model: null } as any
const available = { status: 'available', location } as any
const blocked = { status: 'policyBlocked', location, reasonKeys: ['aiPolicy.blocked.schema'] } as any
const disabled = { status: 'disabled', location } as any

let survey: any
let changeSet: ChangeSet

beforeAll(async () => {
  survey = await buildAssistantSurvey({ languages: ['en', 'fr'] })
  const cluster = getDefByName(survey, 'cluster')
  const remarks = createProposedNodeDef({
    parent: cluster,
    type: 'text',
    cycle: '0',
    name: 'cluster_remarks',
    labels: { en: 'Remarks' },
  })
  changeSet = buildChangeSet({
    survey,
    summary: 'Remarks and labels',
    idFactory: (() => {
      let next = 0
      return () => `id-${next++}`
    })(),
    drafts: [
      { type: 'nodeDef.create', nodeDef: remarks, parentUuid: NodeDef.getUuid(cluster) },
      {
        type: 'label.set',
        nodeDefUuid: NodeDef.getUuid(remarks),
        kind: 'labels',
        lang: 'fr',
        from: null,
        to: 'Remarques',
      },
      {
        type: 'label.set',
        nodeDefUuid: NodeDef.getUuid(getDefByName(survey, 'cluster_id')),
        kind: 'labels',
        lang: 'fr',
        from: null,
        to: 'Identifiant',
      },
      {
        type: 'nodeDef.update',
        nodeDefUuid: NodeDef.getUuid(getDefByName(survey, 'cluster_notes')),
        prop: 'readOnly',
        from: false,
        to: true,
      },
      {
        type: 'expression.set',
        nodeDefUuid: NodeDef.getUuid(getDefByName(survey, 'tree_dec_1')),
        prop: 'validations.expressions',
        from: [],
        to: [NodeDefExpression.createExpression({ expression: 'tree_dec_1 > 0', applyIf: 'cluster_id > 1' })],
      },
    ],
  })
})

describe('assistant areas', () => {
  test('help: hidden when off, available, blocked with the policy reasons', () => {
    expect(getHelpAreaStatus({ categoryEnabled: false, availability: available }).status).toBe('hidden')
    expect(getHelpAreaStatus({ categoryEnabled: true, availability: disabled }).status).toBe('hidden')
    expect(getHelpAreaStatus({ categoryEnabled: true, availability: available })).toEqual({
      area: 'help',
      status: 'available',
      reasonKeys: [],
    })
    expect(getHelpAreaStatus({ categoryEnabled: true, availability: blocked })).toEqual({
      area: 'help',
      status: 'unavailable',
      reasonKeys: ['aiPolicy.blocked.schema'],
    })
  })

  test('design: no survey, no permission, policy, available', () => {
    const base = {
      categoryEnabled: true,
      surveyOpen: true,
      canEditSurvey: true,
      hasDraftSurvey: true,
      availability: available,
    }
    expect(getDesignAreaStatus({ ...base, categoryEnabled: false }).status).toBe('hidden')
    const noSurvey = { ...base, surveyOpen: false, canEditSurvey: false, hasDraftSurvey: false, availability: disabled }
    expect(getDesignAreaStatus(noSurvey).reasonKeys).toEqual(['aiAssistant.unavailable.noSurvey'])
    // a viewer of a published survey: no permission (not "no survey")
    expect(getDesignAreaStatus({ ...base, canEditSurvey: false, hasDraftSurvey: false }).reasonKeys).toEqual([
      'aiAssistant.unavailable.noPermission',
    ])
    expect(getDesignAreaStatus({ ...base, hasDraftSurvey: false }).reasonKeys).toEqual([
      'aiAssistant.unavailable.noSurvey',
    ])
    expect(
      getDesignAreaStatus({ ...base, availability: { status: 'policyBlocked', location } as any }).reasonKeys
    ).toEqual(['aiAssistant.unavailable.policy'])
    expect(getDesignAreaStatus(base).status).toBe('available')
  })

  test('pickArea and isAssistantShown', () => {
    const statuses: AssistantAreaStatus[] = [
      { area: 'design', status: 'available', reasonKeys: [] },
      { area: 'help', status: 'available', reasonKeys: [] },
    ]
    expect(pickArea({ statuses, panelOpen: true, current: null, userSelectedArea: null, module: 'designer' })).toBe(
      'design'
    )
    expect(pickArea({ statuses, panelOpen: true, current: null, userSelectedArea: null, module: 'data' })).toBe('help')
    expect(pickArea({ statuses, panelOpen: true, current: 'help', userSelectedArea: null, module: 'designer' })).toBe(
      'help'
    )
    expect(pickArea({ statuses, panelOpen: true, current: 'help', userSelectedArea: 'design', module: 'data' })).toBe(
      'design'
    )
    const designOnly: AssistantAreaStatus[] = [statuses[0], { area: 'help', status: 'hidden', reasonKeys: [] }]
    expect(
      pickArea({ statuses: designOnly, panelOpen: true, current: 'help', userSelectedArea: null, module: 'data' })
    ).toBe('design')
    const designBlocked: AssistantAreaStatus[] = [
      { area: 'design', status: 'unavailable', reasonKeys: ['aiAssistant.unavailable.policy'] },
      statuses[1],
    ]
    // a click on an unavailable tab shows its reasons; the automatic choice skips it
    expect(
      pickArea({
        statuses: designBlocked,
        panelOpen: true,
        current: 'help',
        userSelectedArea: 'design',
        module: 'data',
      })
    ).toBe('design')
    expect(
      pickArea({ statuses: designBlocked, panelOpen: true, current: null, userSelectedArea: null, module: 'designer' })
    ).toBe('help')
    const noneUsable: AssistantAreaStatus[] = [
      { area: 'design', status: 'unavailable', reasonKeys: ['aiAssistant.unavailable.noSurvey'] },
      { area: 'help', status: 'hidden', reasonKeys: [] },
    ]
    expect(
      pickArea({ statuses: noneUsable, panelOpen: true, current: null, userSelectedArea: null, module: 'home' })
    ).toBe('design')
    expect(isAssistantShown(noneUsable)).toBe(true)
    expect(isAssistantShown([{ area: 'help', status: 'hidden', reasonKeys: [] }])).toBe(false)
  })

  test('parseAppPath', () => {
    expect(parseAppPath('/app/designer/formDesigner/')).toEqual({ module: 'designer', subModule: 'formDesigner' })
    expect(parseAppPath('/app/home/')).toEqual({ module: 'home', subModule: null })
    expect(parseAppPath('/guest/login/')).toEqual({ module: null, subModule: null })
  })
})

describe('assistant panel store', () => {
  test('open, area selection, close resets the user choice', () => {
    const store = createAssistantPanelStore()
    let notified = 0
    const unsubscribe = store.subscribe(() => {
      notified += 1
    })
    store.toggle()
    expect(store.getState().open).toBe(true)
    store.setConversationId('c1')
    store.setArea('help', { byUser: true })
    expect(store.getState()).toMatchObject({
      area: 'help',
      userSelectedArea: 'help',
      conversationId: null,
      view: 'chat',
    })
    store.setConversationId('c2')
    store.setArea('help')
    expect(store.getState().conversationId).toBe('c2')
    store.showHistory()
    expect(store.getState().view).toBe('history')
    store.close()
    expect(store.getState()).toMatchObject({ open: false, userSelectedArea: null, view: 'chat', area: 'help' })
    unsubscribe()
    store.open()
    expect(notified).toBe(7)
  })
})

describe('change set card model', () => {
  test('rows: one per operation, with the names and the values to show', () => {
    const rows = buildCardRows({ cardState: { changeSet }, survey, lang: 'en' })
    expect(rows.map((row) => [row.nodeDefName, row.titleKey, row.titleParams])).toEqual([
      ['cluster_remarks', 'aiAssistant.card.newItem', { type: 'text' }],
      ['cluster_remarks', 'aiAssistant.card.label', { lang: 'fr' }],
      ['cluster_id', 'aiAssistant.card.label', { lang: 'fr' }],
      ['cluster_notes', 'aiAssistant.card.props.readOnly', {}],
      ['tree_dec_1', 'aiAssistant.card.expressionProps.validations', {}],
    ])
    expect(rows[0]).toMatchObject({ from: null, to: { kind: 'text', text: 'Remarks' } })
    expect(rows[3]).toMatchObject({ from: { kind: 'boolean', value: false }, to: { kind: 'boolean', value: true } })
    expect(rows[4].to).toEqual({
      kind: 'expressions',
      items: [{ expression: 'tree_dec_1 > 0', applyIf: 'cluster_id > 1' }],
    })
    expect(rows.every((row) => row.result === null)).toBe(true)
  })

  test('pending operations and staleness', () => {
    const [create, , clusterIdLabel] = changeSet.operations
    expect(getPendingOperationIds({ changeSet })).toHaveLength(5)
    const results = [{ id: create.id, status: 'applied' as const }]
    expect(getPendingOperationIds({ changeSet, results })).not.toContain(create.id)
    expect(getPendingOperationIds({ changeSet, discarded: true })).toEqual([])
    expect(isCardStale({ cardState: { changeSet }, survey })).toBe(false)
    const clusterId = getDefByName(survey, 'cluster_id')
    const relabelled = NodeDef.assocLabels({ ...NodeDef.getLabels(clusterId), fr: 'Autre' })(clusterId)
    const changedSurvey = Survey.assocNodeDef({ nodeDef: relabelled })(survey)
    expect(isCardStale({ cardState: { changeSet }, survey: changedSurvey })).toBe(true)
    const appliedLabel = [{ id: clusterIdLabel.id, status: 'applied' as const }]
    expect(isCardStale({ cardState: { changeSet, results: appliedLabel }, survey: changedSurvey })).toBe(false)
  })

  test('designer links: select in "all node defs" mode, else the nearest page', () => {
    const treeDec = getDefByName(survey, 'tree_dec_1')
    const plot = getDefByName(survey, 'plot')
    const uuid = NodeDef.getUuid(treeDec)
    expect(
      getNodeDefNavigation({ survey, nodeDefUuid: uuid, cycle: '0', viewMode: TreeSelectViewMode.allNodeDefs })
    ).toEqual({
      type: 'select',
      nodeDefUuid: uuid,
    })
    expect(
      getNodeDefNavigation({ survey, nodeDefUuid: uuid, cycle: '0', viewMode: TreeSelectViewMode.onlyPages })
    ).toEqual({
      type: 'page',
      pageNodeDefUuid: NodeDef.getUuid(getDefByName(survey, 'cluster')),
      nodeDefUuid: uuid,
    })
    const plotWithPage = NodeDef.updateLayout(NodeDefLayout.assocPageUuid('0', 'page-plot'))(plot)
    const withPlotPage = Survey.assocNodeDef({ nodeDef: plotWithPage })(survey)
    expect(
      getNodeDefNavigation({
        survey: withPlotPage,
        nodeDefUuid: uuid,
        cycle: '0',
        viewMode: TreeSelectViewMode.onlyPages,
      })
    ).toEqual({ type: 'page', pageNodeDefUuid: NodeDef.getUuid(plot), nodeDefUuid: uuid })
    expect(
      getNodeDefNavigation({ survey, nodeDefUuid: 'missing', cycle: '0', viewMode: TreeSelectViewMode.onlyPages })
    ).toBeNull()
  })
})
