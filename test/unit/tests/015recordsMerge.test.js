import * as Record from '@core/record/record'

import * as DataTest from '../../utils/dataTest'
import * as RB from '../../utils/recordBuilder'
import { TestUtils } from '../../utils/testUtils'

import { getContextUser } from '../../integration/config/context'

const { expectChildrenLengthToBe, expectValueToBe } = TestUtils

let survey = {}
let record1 = null
let record2 = null

describe('Records merge Test', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = DataTest.createTestSurvey({ user })

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
          RB.entity('tree', RB.attribute('tree_id', 1), RB.attribute('tree_height', 13), RB.attribute('dbh', 5)),
          RB.entity('tree', RB.attribute('tree_id', 2), RB.attribute('tree_height', 14), RB.attribute('dbh', 6)),
          RB.entity('tree', RB.attribute('tree_id', 3), RB.attribute('tree_height', 15), RB.attribute('dbh', 7))
        )
      )
    ).build()
  }, 10000)

  it('New entities added', async () => {
    const { record: recordUpdated, nodes: nodesUpdated } = await Record.mergeRecords({
      survey,
      recordSource: record2,
    })(record1)

    expect(Object.values(nodesUpdated).length).toBe(26)

    expectChildrenLengthToBe({ survey, record: recordUpdated, path: 'cluster', childName: 'plot', expectedLength: 3 })

    expectValueToBe({ survey, record: recordUpdated, path: 'cluster.plot[0].plot_id', expectedValue: 1 })
    expectValueToBe({ survey, record: recordUpdated, path: 'cluster.plot[1].plot_id', expectedValue: 2 })
    expectValueToBe({ survey, record: recordUpdated, path: 'cluster.plot[2].plot_id', expectedValue: 3 })

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

    expectValueToBe({
      survey,
      record: recordUpdated,
      path: 'cluster.plot[0].plot_multiple_number[0]',
      expectedValue: 10,
    })
    expectValueToBe({
      survey,
      record: recordUpdated,
      path: 'cluster.plot[0].plot_multiple_number[1]',
      expectedValue: 20,
    })
  })

  it('Multiple attributes replaced', async () => {
    const { record: recordUpdated } = await Record.mergeRecords({
      survey,
      recordSource: record2,
    })(record1)

    expectValueToBe({
      survey,
      record: recordUpdated,
      path: 'cluster.plot[1].plot_multiple_number[0]',
      expectedValue: 30,
    })
    expectValueToBe({
      survey,
      record: recordUpdated,
      path: 'cluster.plot[1].plot_multiple_number[1]',
      expectedValue: 40,
    })
    expectValueToBe({
      survey,
      record: recordUpdated,
      path: 'cluster.plot[1].plot_multiple_number[2]',
      expectedValue: 50,
    })
  })
})
