import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as DataTest from '../../utils/dataTest'
import * as RB from '../../utils/recordBuilder'
import { TestUtils } from '../../utils/testUtils'
import { findNodeByPath, shiftDateModifiedIntoTheFuture } from '../../utils/recordUtils'

import { getContextUser } from '../../integration/config/context'

const { expectChildrenLengthToBe, expectValueToBe } = TestUtils

let survey = {}
let record1 = null
let record2 = null

const expectValuesToBe = ({ expectedValuesByPath, record: recordUpdated }) => {
  Object.entries(expectedValuesByPath).forEach(([path, expectedValue]) => {
    expectValueToBe({ survey, record: recordUpdated, path, expectedValue })
  })
}

describe('Records merge Test', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = await DataTest.createTestSurvey({ user })

    record1 = RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_id', 1),
        RB.attribute('cluster_distance', 18),
        RB.attribute('cluster_accessible', 'true'),
        RB.attribute('visit_date', '2021-01-01'),
        RB.attribute('visit_time', '10:30'),
        RB.entity(
          'plot',
          RB.attribute('plot_id', 1),
          RB.attribute('plot_multiple_number', 10),
          RB.attribute('plot_multiple_number', 20),
          RB.entity('tree', RB.attribute('tree_id', 1), RB.attribute('tree_height', 10), RB.attribute('dbh', 7)),
          RB.entity('tree', RB.attribute('tree_id', 2), RB.attribute('tree_height', 20), RB.attribute('dbh', 10.123))
        ),
        RB.entity(
          'plot',
          RB.attribute('plot_id', 2),
          RB.entity('tree', RB.attribute('tree_id', 1), RB.attribute('tree_height', 12), RB.attribute('dbh', 18)),
          RB.entity('tree', RB.attribute('tree_id', 2), RB.attribute('tree_height', 10), RB.attribute('dbh', 15)),
          RB.entity('tree', RB.attribute('tree_id', 3), RB.attribute('tree_height', 30), RB.attribute('dbh', 20))
        ),
        RB.entity(
          'plot',
          RB.attribute('plot_id', 3),
          RB.attribute('plot_multiple_number', 100),
          RB.attribute('plot_multiple_number', 200)
        )
      )
    ).build()

    record2 = RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_id', 1),
        RB.attribute('cluster_distance', 18),
        RB.attribute('cluster_accessible', 'true'),
        RB.attribute('visit_date', '2021-01-01'),
        RB.attribute('visit_time', '11:30'),
        RB.entity(
          'plot',
          RB.attribute('plot_id', 1),
          RB.entity('tree', RB.attribute('tree_id', 3), RB.attribute('tree_height', 30), RB.attribute('dbh', 8)),
          RB.entity('tree', RB.attribute('tree_id', 4), RB.attribute('tree_height', 40), RB.attribute('dbh', 15))
        ),
        RB.entity(
          'plot',
          RB.attribute('plot_id', 2),
          RB.attribute('plot_multiple_number', 30),
          RB.attribute('plot_multiple_number', 40),
          RB.attribute('plot_multiple_number', 50)
        ),
        RB.entity(
          'plot',
          RB.attribute('plot_id', 3),
          RB.attribute('plot_multiple_number', 200),
          RB.attribute('plot_multiple_number', 300)
        ),
        RB.entity(
          'plot',
          RB.attribute('plot_id', 4),
          RB.attribute('plot_multiple_number', 90),
          RB.attribute('plot_multiple_number', 100),
          RB.attribute('plot_multiple_number', 110),
          RB.entity('tree', RB.attribute('tree_id', 1), RB.attribute('tree_height', 13), RB.attribute('dbh', 5)),
          RB.entity('tree', RB.attribute('tree_id', 2), RB.attribute('tree_height', 14), RB.attribute('dbh', 6)),
          RB.entity('tree', RB.attribute('tree_id', 3), RB.attribute('tree_height', 15), RB.attribute('dbh', 7))
        )
      )
    ).build()

    record2 = shiftDateModifiedIntoTheFuture(record2)
  }, 10000)

  it('New entities added', async () => {
    const { record: recordUpdated, nodes: nodesUpdated } = await Record.mergeRecords({
      survey,
      recordSource: record2,
    })(record1)

    expect(Object.values(nodesUpdated).length).toBe(30)

    expectChildrenLengthToBe({ survey, record: recordUpdated, path: 'cluster', childName: 'plot', expectedLength: 4 })

    const expectedValuesByPath = {
      'cluster.plot[0].plot_id': 1,
      'cluster.plot[1].plot_id': 2,
      'cluster.plot[2].plot_id': 3,
      'cluster.plot[3].plot_id': 4,
    }
    expectValuesToBe({ expectedValuesByPath, record: recordUpdated })

    expectChildrenLengthToBe({
      survey,
      record: recordUpdated,
      path: 'cluster.plot[0]',
      childName: 'tree',
      expectedLength: 4,
    })
  })

  it('Multiple attributes not deleted', async () => {
    const { record: recordUpdated } = await Record.mergeRecords({
      survey,
      recordSource: record2,
    })(record1)

    const expectedValuesByPath = {
      'cluster.plot[0].plot_multiple_number[0]': 10,
      'cluster.plot[0].plot_multiple_number[1]': 20,
    }
    expectValuesToBe({ expectedValuesByPath, record: recordUpdated })
  })

  it('Multiple attributes added', async () => {
    const { record: recordUpdated } = await Record.mergeRecords({
      survey,
      recordSource: record2,
    })(record1)

    const expectedValuesByPath = {
      'cluster.plot[1].plot_multiple_number[0]': 30,
      'cluster.plot[1].plot_multiple_number[1]': 40,
      'cluster.plot[1].plot_multiple_number[2]': 50,
    }
    expectValuesToBe({ expectedValuesByPath, record: recordUpdated })
  })

  it('Multiple attributes merged', async () => {
    const { record: recordUpdated } = await Record.mergeRecords({
      survey,
      recordSource: record2,
    })(record1)

    const expectedValuesByPath = {
      'cluster.plot[2].plot_multiple_number[0]': 100,
      'cluster.plot[2].plot_multiple_number[1]': 200,
      'cluster.plot[2].plot_multiple_number[2]': 300,
    }
    expectValuesToBe({ expectedValuesByPath, record: recordUpdated })
  })

  it('Nodes added from a different record get new uuids', async () => {
    const { record: recordUpdated } = await Record.mergeRecords({
      survey,
      recordSource: record2,
    })(record1)

    const plotSource = findNodeByPath('cluster.plot[3]')(survey, record2)
    const plotMerged = findNodeByPath('cluster.plot[3]')(survey, recordUpdated)
    expect(Node.getUuid(plotMerged)).not.toBe(Node.getUuid(plotSource))
  })

  it('Nodes added from another version of the same record keep their uuids', async () => {
    // e.g. the copy of record1 edited in a mobile device, sent back to be merged with the server version
    const recordSource = { ...record2, uuid: Record.getUuid(record1) }

    const { record: recordUpdated } = await Record.mergeRecords({
      survey,
      recordSource,
    })(record1)

    const paths = ['cluster.plot[3]', 'cluster.plot[3].plot_multiple_number[1]', 'cluster.plot[3].tree[2]']
    paths.forEach((path) => {
      const nodeSource = findNodeByPath(path)(survey, recordSource)
      const nodeMerged = findNodeByPath(path)(survey, recordUpdated)
      expect(Node.getUuid(nodeMerged)).toBe(Node.getUuid(nodeSource))
      expect(Node.getRecordUuid(nodeMerged)).toBe(Record.getUuid(record1))
    })
    // multiple attribute value added to an existing entity
    const multipleAttrSource = findNodeByPath('cluster.plot[1].plot_multiple_number[0]')(survey, recordSource)
    const multipleAttrMerged = findNodeByPath('cluster.plot[1].plot_multiple_number[0]')(survey, recordUpdated)
    expect(Node.getUuid(multipleAttrMerged)).toBe(Node.getUuid(multipleAttrSource))
  })

  it('Merging the same version of a record twice does not duplicate nodes', async () => {
    const recordSource = { ...record2, uuid: Record.getUuid(record1) }

    const { record: recordMergedOnce } = await Record.mergeRecords({ survey, recordSource })(record1)
    const { record: recordMergedTwice } = await Record.mergeRecords({ survey, recordSource })(recordMergedOnce)

    expect(Record.getNodesArray(recordMergedTwice).length).toBe(Record.getNodesArray(recordMergedOnce).length)
    expectChildrenLengthToBe({
      survey,
      record: recordMergedTwice,
      path: 'cluster',
      childName: 'plot',
      expectedLength: 4,
    })
    expectChildrenLengthToBe({
      survey,
      record: recordMergedTwice,
      path: 'cluster.plot[0]',
      childName: 'tree',
      expectedLength: 4,
    })
  })
})
