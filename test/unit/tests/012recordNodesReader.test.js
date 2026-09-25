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

    survey = await DataTest.createTestSurvey({ user })

    record = DataTest.createTestRecord({ user, survey })
  }, 10000)

  it('Test find child node by key values', () => {
    const plotIdDef = getNodeDef('cluster/plot/plot_id')

    // find plot with plot_id = 1
    const plot1Found = findPlotWithId({ plotId: 1 })
    const plot1FoundId = Record.getNodeChildByDefUuid(plot1Found, plotIdDef.uuid)(record)
    expect(Node.getValue(plot1FoundId)).toBe(1)
    expect(plot1Found).toStrictEqual(getNode('cluster/plot[0]'))

    // find plot with plot_id = 2
    const plot2Found = findPlotWithId({ plotId: 2 })
    const plot2FoundId = Record.getNodeChildByDefUuid(plot2Found, plotIdDef.uuid)(record)
    expect(Node.getValue(plot2FoundId)).toBe(2)
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
    expect(Node.getValue(tree1FoundId)).toBe(1)
    expect(tree1Found).toStrictEqual(getNode('cluster/plot[0]/tree[0]'))

    // find tree in plot 1 with tree_id = 2
    const tree2Found = findTreeWithId({ plotId: 1, treeId: 2 })
    const tree2FoundId = Record.getNodeChildByDefUuid(tree2Found, treeIdDef.uuid)(record)
    expect(Node.getValue(tree2FoundId)).toBe(2)
    expect(tree2Found).toStrictEqual(getNode('cluster/plot[0]/tree[1]'))
  })
})

describe('RecordReader Test (entity keys index cache)', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = await DataTest.createTestSurvey({ user })

    record = DataTest.createTestRecord({ user, survey })
  }, 10000)

  const findPlot = ({ plotId, entityKeysIndexCache, recordToSearch = record }) =>
    Record.findChildByKeyValues({
      survey,
      parentNode: Record.getRootNode(recordToSearch),
      childDefUuid: getNodeDef('cluster/plot').uuid,
      keyValuesByDefUuid: { [getNodeDef('cluster/plot/plot_id').uuid]: plotId },
      entityKeysIndexCache,
    })(recordToSearch)

  const getOrCreatePlot = ({ plotId, entityKeysIndexCache, recordToUpdate }) =>
    Record.getOrCreateEntityByKeys({
      user: getContextUser(),
      survey,
      entityDefUuid: getNodeDef('cluster/plot').uuid,
      valuesByDefUuid: {
        [getNodeDef('cluster/cluster_id').uuid]: Node.getValue(
          RecordUtils.findNodeByPath('cluster/cluster_id')(survey, recordToUpdate)
        ),
        [getNodeDef('cluster/plot/plot_id').uuid]: plotId,
      },
      insertMissingNodes: true,
      updateDependents: false,
      entityKeysIndexCache,
    })(recordToUpdate)

  it('Test find child node by key values using the cache', () => {
    const entityKeysIndexCache = new Record.EntityKeysIndexCache()

    expect(findPlot({ plotId: 1, entityKeysIndexCache })).toStrictEqual(getNode('cluster/plot[0]'))
    expect(findPlot({ plotId: 2, entityKeysIndexCache })).toStrictEqual(getNode('cluster/plot[1]'))
    expect(findPlot({ plotId: '2', entityKeysIndexCache })).toStrictEqual(getNode('cluster/plot[1]'))
    expect(findPlot({ plotId: 99, entityKeysIndexCache })).toBeUndefined()
  })

  it('Test entities created using the cache are found without creating duplicates', async () => {
    const entityKeysIndexCache = new Record.EntityKeysIndexCache()
    // build the index
    expect(findPlot({ plotId: 99, entityKeysIndexCache })).toBeUndefined()

    const { entity: plotCreated, updateResult } = await getOrCreatePlot({
      plotId: 99,
      entityKeysIndexCache,
      recordToUpdate: record,
    })
    expect(Node.isCreated(plotCreated)).toBeTruthy()
    const recordUpdated = updateResult.record

    expect(findPlot({ plotId: 99, entityKeysIndexCache, recordToSearch: recordUpdated })).toStrictEqual(
      Record.getNodeByUuid(Node.getUuid(plotCreated))(recordUpdated)
    )
    const { entity: plotFound } = await getOrCreatePlot({
      plotId: 99,
      entityKeysIndexCache,
      recordToUpdate: recordUpdated,
    })
    expect(Node.getUuid(plotFound)).toEqual(Node.getUuid(plotCreated))
  })

  it('Test cache is rebuilt when entities are added without using it', async () => {
    const entityKeysIndexCache = new Record.EntityKeysIndexCache()
    // build the index
    expect(findPlot({ plotId: 98, entityKeysIndexCache })).toBeUndefined()

    // create entity without using the cache
    const { entity: plotCreated, updateResult } = await getOrCreatePlot({ plotId: 98, recordToUpdate: record })
    const recordUpdated = updateResult.record

    expect(Node.getUuid(findPlot({ plotId: 98, entityKeysIndexCache, recordToSearch: recordUpdated }))).toEqual(
      Node.getUuid(plotCreated)
    )
  })
})
