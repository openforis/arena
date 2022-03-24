import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

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
    parentNode: clusterNode,
    childDefUuid: plotDef.uuid,
    keyValuesByDefUuid: { [plotIdDef.uuid]: plotId },
  })(record)
}

const findTreeWithId = ({ plotId, treeId }) => {
  const plotIdDef = getNodeDef('cluster/plot/plot_id')
  const treeDef = getNodeDef('cluster/plot/tree')
  const treeIdDef = getNodeDef('cluster/plot/tree/tree_id')

  return Record.findDescendantByKeyValues({
    survey,
    descendantDefUuid: treeDef.uuid,
    keyValuesByDefUuid: {
      [plotIdDef.uuid]: plotId,
      [treeIdDef.uuid]: treeId,
    },
  })(record)
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

  it('Test find descendant (plot) by key values', () => {
    const plotDef = getNodeDef('cluster/plot')
    const plotIdDef = getNodeDef('cluster/plot/plot_id')

    const plotFound = Record.findDescendantByKeyValues({
      survey,
      descendantDefUuid: plotDef.uuid,
      keyValuesByDefUuid: {
        [plotIdDef.uuid]: 2,
      },
    })(record)

    expect(plotFound).toStrictEqual(getNode('cluster/plot[1]'))
  })

  it('Test find nested child nodes (trees) by key values', () => {
    const treeIdDef = getNodeDef('cluster/plot/tree/tree_id')

    // find tree in plot 1 with tree_id = 1
    const tree1Found = findTreeWithId({ plotId: 1, treeId: 1 })
    const tree1FoundId = Record.getNodeChildByDefUuid(tree1Found, treeIdDef.uuid)(record)
    expect(Node.getValue(tree1FoundId)).toEqual(1)
    expect(tree1Found).toStrictEqual(getNode('cluster/plot[0]/tree[0]'))

    // find tree in plot 1 with tree_id = 2
    const tree2Found = findTreeWithId({ plotId: 1, treeId: 2 })
    const tree2FoundId = Record.getNodeChildByDefUuid(tree2Found, treeIdDef.uuid)(record)
    expect(Node.getValue(tree2FoundId)).toEqual(2)
    expect(tree2Found).toStrictEqual(getNode('cluster/plot[0]/tree[1]'))
  })
})
