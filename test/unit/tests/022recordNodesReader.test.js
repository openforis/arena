import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Survey from '@core/survey/survey'

import * as RecordUtils from '../../utils/recordUtils'
import * as SurveyUtils from '../../utils/surveyUtils'
import * as DataTest from '../../utils/dataTest'

import { getContextUser } from '../../integration/config/context'

let survey = {}
let record = {}

const getNode = (path) => RecordUtils.findNodeByPath(path)(survey, record)
const getNodeDef = (path) => SurveyUtils.getNodeDefByPath({ survey, path })

const findPlotWithId = ({ plotId }) => {
  const clusterNode = getNode('cluster')
  const plotDef = getNodeDef('cluster/plot')
  const plotIdDef = getNodeDef('cluster/plot/plot_id')

  return Record.findChildByKeyValues({
    survey,
    record,
    parentNode: clusterNode,
    childDefUuid: plotDef.uuid,
    valuesByDefUuid: { [plotIdDef.uuid]: plotId },
  })
}

describe('RecordReader Test', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = DataTest.createTestSurvey({ user })

    record = DataTest.createTestRecord({ user, survey })
  }, 10000)

  it('Test find child node by key values', () => {
    const plotIdDef = getNodeDef('cluster/plot/plot_id')

    // find plot with plot_id = 1
    const plot1Found = findPlotWithId({ plotId: 1 })
    const plot1FoundId = Record.getNodeChildByDefUuid(plot1Found, plotIdDef.uuid)(record)
    expect(Node.getValue(plot1FoundId)).toEqual(1)
    expect(plot1Found).toStrictEqual(getNode('cluster/plot[0]'))

    // find plot with plot_id = 2
    const plot2Found = findPlotWithId({ plotId: 2 })
    const plot2FoundId = Record.getNodeChildByDefUuid(plot2Found, plotIdDef.uuid)(record)
    expect(Node.getValue(plot2FoundId)).toEqual(2)
    expect(plot2Found).toStrictEqual(getNode('cluster/plot[1]'))
  })

  it('Test find nested child node by key values', () => {
    const plot1Node = getNode('cluster/plot[0]')
    const treeDef = getNodeDef('cluster/plot/tree')
    const treeIdDef = getNodeDef('cluster/plot/tree/tree_id')

    // find tree in plot 1 with tree_id = 1
    const tree1Found = Record.findChildByKeyValues({
      survey,
      record,
      parentNode: plot1Node,
      childDefUuid: treeDef.uuid,
      valuesByDefUuid: { [treeIdDef.uuid]: 1 },
    })
    const tree1FoundId = Record.getNodeChildByDefUuid(tree1Found, treeIdDef.uuid)(record)
    expect(Node.getValue(tree1FoundId)).toEqual(1)
    expect(tree1Found).toStrictEqual(getNode('cluster/plot[0]/tree[0]'))

    // find tree in plot 1 with tree_id = 2
    const tree2Found = Record.findChildByKeyValues({
      survey,
      record,
      parentNode: plot1Node,
      childDefUuid: treeDef.uuid,
      valuesByDefUuid: { [treeIdDef.uuid]: 2 },
    })
    const tree2FoundId = Record.getNodeChildByDefUuid(tree2Found, treeIdDef.uuid)(record)
    expect(Node.getValue(tree2FoundId)).toEqual(2)
    expect(tree2Found).toStrictEqual(getNode('cluster/plot[0]/tree[1]'))
  })

  it('Test find descendant by key values', () => {
    const plotIdDef = getNodeDef('cluster/plot/plot_id')
    const treeDef = getNodeDef('cluster/plot/tree')
    const treeIdDef = getNodeDef('cluster/plot/tree/tree_id')

    const treeFound = Record.findDescendantByKeyValues({
      survey,
      record,
      descendantDefUuid: treeDef.uuid,
      valuesByDefUuid: {
        [plotIdDef.uuid]: 2,
        [treeIdDef.uuid]: 3,
      },
    })
    const treeFoundId = Record.getNodeChildByDefUuid(treeFound, treeIdDef.uuid)(record)
    expect(Node.getValue(treeFoundId)).toEqual(3)
    expect(treeFound).toStrictEqual(getNode('cluster/plot[1]/tree[2]'))
  })
})
