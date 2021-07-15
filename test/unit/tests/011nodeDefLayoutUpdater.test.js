import { uuidv4 } from '@core/uuid'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefLayoutUpdater from '@core/survey/nodeDefLayoutUpdater'

import { getContextUser } from '../../integration/config/context'

import * as DataTest from '../../utils/dataTest'

const FORM_IN_NEW_PAGE_NAME = 'form_in_new_page'

let survey = {}

const _updateLayoutAndExpectParentChildrenIndexToBe = ({ nodeDefName, layout, expectedIndex }) => {
  const nodeDef = Survey.getNodeDefByName(nodeDefName)(survey)

  const nodeDefsUpdated = NodeDefLayoutUpdater.updateLayout({ survey, nodeDefUuid: nodeDef.uuid, layout })

  // expect updated node defs to be the specified node def and its parent
  const nodeDefsUpdatedNames = Object.values(nodeDefsUpdated).map(NodeDef.getName)
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)

  expect(nodeDefsUpdatedNames.length).toBe(2)
  expect(nodeDefsUpdatedNames).toContain(NodeDef.getName(nodeDef))
  expect(nodeDefsUpdatedNames).toContain(NodeDef.getName(nodeDefParent))

  survey = Survey.mergeNodeDefs(nodeDefsUpdated)(survey)

  const nodeDefParentUpdated = Survey.getNodeDefParent(nodeDef)(survey)

  const indexChildrenUpdated = NodeDefLayout.getIndexChildren(Survey.cycleOneKey)(nodeDefParentUpdated)

  expect(indexChildrenUpdated).toStrictEqual(expectedIndex)
}

describe('NodeDefLayoutUpdater Test', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = DataTest.createTestSurvey({ user })
  }, 10000)

  it('Layout initialized', () => {
    const cluster = Survey.getNodeDefByName('cluster')(survey)
    const indexChildren = NodeDefLayout.getIndexChildren(Survey.cycleOneKey)(cluster)

    expect(indexChildren).toBeDefined()

    const plot = Survey.getNodeDefByName('plot')(survey)
    expect(indexChildren).toStrictEqual([plot.uuid])
  })

  it('Index children updated on node def insert', () => {
    const cluster = Survey.getNodeDefByName('cluster')(survey)
    const plot = Survey.getNodeDefByName('plot')(survey)

    const cycle = Survey.cycleOneKey
    const nodeDef = {
      uuid: uuidv4(),
      type: NodeDef.nodeDefType.entity,
      parentUuid: cluster.uuid,
      props: {
        name: FORM_IN_NEW_PAGE_NAME,
        multiple: true,
        cycles: [cycle],
        layout: {
          [cycle]: {
            [NodeDefLayout.keys.renderType]: NodeDefLayout.renderType.form,
            [NodeDefLayout.keys.pageUuid]: uuidv4(),
          },
        },
      },
    }
    survey = Survey.assocNodeDef({ nodeDef })(survey)

    const clusterUpdated = NodeDefLayoutUpdater.updateParentLayout({ survey, nodeDef, cyclesAdded: [cycle] })

    const indexChildren = NodeDefLayout.getIndexChildren(Survey.cycleOneKey)(clusterUpdated)

    expect(indexChildren).toStrictEqual([plot.uuid, nodeDef.uuid])

    survey = Survey.assocNodeDef({ nodeDef: clusterUpdated })(survey)
  })

  it('Index children updated on node def delete', () => {
    const cycle = Survey.cycleOneKey

    const plot = Survey.getNodeDefByName('plot')(survey)
    const nodeDef = Survey.getNodeDefByName(FORM_IN_NEW_PAGE_NAME)(survey)
    const nodeDefUpdated = { ...nodeDef, deleted: true }

    survey = Survey.assocNodeDef({ nodeDef: nodeDefUpdated })(survey)

    const clusterUpdated = NodeDefLayoutUpdater.updateParentLayout({
      survey,
      nodeDef: nodeDefUpdated,
      cyclesDeleted: [cycle],
    })
    const indexChildren = NodeDefLayout.getIndexChildren(Survey.cycleOneKey)(clusterUpdated)

    expect(indexChildren).toStrictEqual([plot.uuid])

    survey = Survey.assocNodeDef({ nodeDef: clusterUpdated })(survey)

    survey = Survey.dissocNodeDef(nodeDefUpdated.uuid)(survey)
  })

  it('Index children updated on node def render type change', () => {
    const cycle = Survey.cycleOneKey

    const cluster = Survey.getNodeDefByName('cluster')(survey)
    const plot = Survey.getNodeDefByName('plot')(survey)

    // add new node def with render type form (added to parent children index)
    const nodeDef = {
      uuid: uuidv4(),
      type: NodeDef.nodeDefType.entity,
      parentUuid: cluster.uuid,
      props: {
        name: FORM_IN_NEW_PAGE_NAME,
        multiple: true,
        cycles: [cycle],
        layout: {
          [cycle]: {
            [NodeDefLayout.keys.renderType]: NodeDefLayout.renderType.form,
            [NodeDefLayout.keys.pageUuid]: uuidv4(),
          },
        },
      },
    }
    survey = Survey.assocNodeDef({ nodeDef })(survey)

    const clusterUpdated = NodeDefLayoutUpdater.updateParentLayout({ survey, nodeDef, cyclesAdded: [cycle] })
    survey = Survey.assocNodeDef({ nodeDef: clusterUpdated })(survey)

    const indexChildren = NodeDefLayout.getIndexChildren(Survey.cycleOneKey)(clusterUpdated)

    expect(indexChildren).toStrictEqual([plot.uuid, nodeDef.uuid])

    // update render type of added node def into "table" (it should be removed from parent children index)
    _updateLayoutAndExpectParentChildrenIndexToBe({
      nodeDefName: FORM_IN_NEW_PAGE_NAME,
      layout: { [cycle]: { renderType: NodeDefLayout.renderType.table, pageUuid: null } },
      expectedIndex: [plot.uuid],
    })

    // update render type of added node def into "form" (it should be added to parent children index)
    _updateLayoutAndExpectParentChildrenIndexToBe({
      nodeDefName: FORM_IN_NEW_PAGE_NAME,
      layout: { [cycle]: { renderType: NodeDefLayout.renderType.form, pageUuid: uuidv4() } },
      expectedIndex: [plot.uuid, nodeDef.uuid],
    })
  })
})
