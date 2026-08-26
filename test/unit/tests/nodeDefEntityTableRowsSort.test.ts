import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Survey from '@core/survey/survey'

import {
  getNextSortCriteria,
  sortNodes,
  SortCriterion,
} from '@webapp/components/survey/SurveyForm/nodeDefs/components/types/nodeDefEntityTableRowsSort'

import * as RecordUtils from '../../utils/recordUtils'
import * as SurveyUtils from '../../utils/surveyUtils'
import * as DataTest from '../../utils/dataTest'

import { getContextUser } from '../../integration/config/context'

let survey: any = {}
let record: any = {}

const getNode = (path: string) => RecordUtils.findNodeByPath(path)(survey, record)
const getNodeDef = (path: string) => SurveyUtils.getNodeDefByPath({ survey, path })

describe('nodeDefEntityTableRowsSort', () => {
  beforeAll(async () => {
    const user = getContextUser()
    survey = await DataTest.createTestSurvey({ user })
    record = DataTest.createTestRecord({ user, survey })
  }, 10000)

  describe('getNextSortCriteria', () => {
    test('adds a new field as ascending when not already sorted', () => {
      const result = getNextSortCriteria({ sortCriteria: [], field: 'a' })
      expect(result).toEqual([{ by: 'a', order: 'asc' }])
    })

    test('cycles an active ascending field to descending', () => {
      const result = getNextSortCriteria({ sortCriteria: [{ by: 'a', order: 'asc' }], field: 'a' })
      expect(result).toEqual([{ by: 'a', order: 'desc' }])
    })

    test('removes an active descending field', () => {
      const result = getNextSortCriteria({ sortCriteria: [{ by: 'a', order: 'desc' }], field: 'a' })
      expect(result).toEqual([])
    })

    test('adds a second field without disturbing the first (additive)', () => {
      const result = getNextSortCriteria({ sortCriteria: [{ by: 'a', order: 'asc' }], field: 'b' })
      expect(result).toEqual([
        { by: 'a', order: 'asc' },
        { by: 'b', order: 'asc' },
      ])
    })

    test('removing a middle criterion shifts later criteria up in priority', () => {
      const sortCriteria: SortCriterion[] = [
        { by: 'a', order: 'desc' },
        { by: 'b', order: 'asc' },
        { by: 'c', order: 'asc' },
      ]
      const result = getNextSortCriteria({ sortCriteria, field: 'a' })
      expect(result).toEqual([
        { by: 'b', order: 'asc' },
        { by: 'c', order: 'asc' },
      ])
    })
  })

  describe('sortNodes', () => {
    const treeIdOf = (node: any) => {
      const treeIdDef = getNodeDef('cluster/plot/tree/tree_id')
      return Node.getValue(Record.getNodeChildByDefUuid(node, treeIdDef.uuid)(record))
    }

    test('sorts by a single numeric column, ascending, keeping stable order on ties', () => {
      const plot3 = getNode('cluster/plot[2]')
      const treeDef = getNodeDef('cluster/plot/tree')
      const treeHeightDef = getNodeDef('cluster/plot/tree/tree_height')
      const nodes = Record.getNodeChildrenByDefUuid(plot3, treeDef.uuid)(record)

      const sorted = sortNodes({
        nodes,
        sortCriteria: [{ by: treeHeightDef.uuid, order: 'asc' }],
        nodeDefColumns: [treeHeightDef],
        survey,
        cycle: Survey.cycleOneKey,
        lang: 'en',
        record,
      })

      // heights: tree1=13 tree2=10 tree3=11 tree4=10 tree5=33
      // tree2/tree4 tie on height=10; original order (tree2 before tree4) is preserved
      expect(sorted.map(treeIdOf)).toEqual([2, 4, 3, 1, 5])
    })

    test('sorts by a single numeric column, descending', () => {
      const plot3 = getNode('cluster/plot[2]')
      const treeDef = getNodeDef('cluster/plot/tree')
      const treeHeightDef = getNodeDef('cluster/plot/tree/tree_height')
      const nodes = Record.getNodeChildrenByDefUuid(plot3, treeDef.uuid)(record)

      const sorted = sortNodes({
        nodes,
        sortCriteria: [{ by: treeHeightDef.uuid, order: 'desc' }],
        nodeDefColumns: [treeHeightDef],
        survey,
        cycle: Survey.cycleOneKey,
        lang: 'en',
        record,
      })

      expect(sorted.map(treeIdOf)).toEqual([5, 1, 3, 2, 4])
    })

    test('breaks ties on the primary column using a second sort column', () => {
      const plot3 = getNode('cluster/plot[2]')
      const treeDef = getNodeDef('cluster/plot/tree')
      const treeHeightDef = getNodeDef('cluster/plot/tree/tree_height')
      const dbhDef = getNodeDef('cluster/plot/tree/dbh')
      const nodes = Record.getNodeChildrenByDefUuid(plot3, treeDef.uuid)(record)

      const sorted = sortNodes({
        nodes,
        sortCriteria: [
          { by: treeHeightDef.uuid, order: 'asc' },
          { by: dbhDef.uuid, order: 'asc' },
        ],
        nodeDefColumns: [treeHeightDef, dbhDef],
        survey,
        cycle: Survey.cycleOneKey,
        lang: 'en',
        record,
      })

      // dbh breaks the height=10 tie between tree2 (dbh 15) and tree4 (dbh 7)
      expect(sorted.map(treeIdOf)).toEqual([4, 2, 3, 1, 5])
    })

    test('sorts blank values last regardless of direction', () => {
      const plot1 = getNode('cluster/plot[0]')
      const treeDef = getNodeDef('cluster/plot/tree')
      const speciesDef = getNodeDef('cluster/plot/tree/tree_species')
      const nodes = Record.getNodeChildrenByDefUuid(plot1, treeDef.uuid)(record)

      const sortedAsc = sortNodes({
        nodes,
        sortCriteria: [{ by: speciesDef.uuid, order: 'asc' }],
        nodeDefColumns: [speciesDef],
        survey,
        cycle: Survey.cycleOneKey,
        lang: 'en',
        record,
      })
      const sortedDesc = sortNodes({
        nodes,
        sortCriteria: [{ by: speciesDef.uuid, order: 'desc' }],
        nodeDefColumns: [speciesDef],
        survey,
        cycle: Survey.cycleOneKey,
        lang: 'en',
        record,
      })

      // tree1 has a species set, tree2 does not -> tree2 sorts last both ways
      expect(sortedAsc.map(treeIdOf)).toEqual([1, 2])
      expect(sortedDesc.map(treeIdOf)).toEqual([1, 2])
    })

    test('keeps placeholder rows pinned at the bottom regardless of sort', () => {
      const plot3 = getNode('cluster/plot[2]')
      const treeDef = getNodeDef('cluster/plot/tree')
      const treeHeightDef = getNodeDef('cluster/plot/tree/tree_height')
      const realNodes = Record.getNodeChildrenByDefUuid(plot3, treeDef.uuid)(record)
      const placeholder = Node.newNodePlaceholder(treeDef, plot3)
      const nodes = [...realNodes, placeholder]

      const sorted = sortNodes({
        nodes,
        sortCriteria: [{ by: treeHeightDef.uuid, order: 'desc' }],
        nodeDefColumns: [treeHeightDef],
        survey,
        cycle: Survey.cycleOneKey,
        lang: 'en',
        record,
      })

      expect(sorted[sorted.length - 1]).toBe(placeholder)
      expect(sorted.length).toBe(nodes.length)
    })

    test('returns the nodes array unchanged when no sort criteria are active', () => {
      const plot3 = getNode('cluster/plot[2]')
      const treeDef = getNodeDef('cluster/plot/tree')
      const nodes = Record.getNodeChildrenByDefUuid(plot3, treeDef.uuid)(record)

      const sorted = sortNodes({
        nodes,
        sortCriteria: [],
        nodeDefColumns: [],
        survey,
        cycle: Survey.cycleOneKey,
        lang: 'en',
        record,
      })

      expect(sorted).toBe(nodes)
    })
  })
})
