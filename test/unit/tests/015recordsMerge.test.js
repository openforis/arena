import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Srs from '@core/geo/srs'

import * as RecordUtils from '../../utils/recordUtils'
import * as SurveyUtils from '../../utils/surveyUtils'
import * as DataTest from '../../utils/dataTest'
import * as RB from '../../utils/recordBuilder'

import { getContextUser } from '../../integration/config/context'
import { RecordPrettyPrinter } from '@openforis/arena-core'

let survey = {}
let record = {}

const getNodeDef = (path) => SurveyUtils.getNodeDefByPath({ survey, path })

describe('Records merge Test', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = DataTest.createTestSurvey({ user })
  }, 10000)

  it('New entities added', async () => {
    const user = getContextUser()

    const record1 = RB.record(
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

    const record2 = RB.record(
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
          RB.attribute('plot_id', 3),
          RB.entity('tree', RB.attribute('tree_id', 1), RB.attribute('tree_height', 13), RB.attribute('dbh', 5)),
          RB.entity('tree', RB.attribute('tree_id', 2), RB.attribute('tree_height', 14), RB.attribute('dbh', 6)),
          RB.entity('tree', RB.attribute('tree_id', 3), RB.attribute('tree_height', 15), RB.attribute('dbh', 7))
        )
      )
    ).build()
    const plotDef = getNodeDef('cluster/plot')
    const plotIdDef = getNodeDef('cluster/plot/plot_id')
    const treeDef = getNodeDef('cluster/plot/tree')
    const treeIdDef = getNodeDef('cluster/plot/tree/tree_id')
    const treeDbhDef = getNodeDef('cluster/plot/tree/dbh')

    const { record: recordUpdated, nodes: nodesUpdated } = await Record.mergeRecords({
      survey,
      recordSource: record2,
    })(record1)

    const rootNode = Record.getRootNode(recordUpdated)

    expect(Object.values(nodesUpdated).length).toBe(28)

    const plotNodes = Record.getNodeChildrenByDefUuid(rootNode, plotDef.uuid)(recordUpdated)
    expect(plotNodes.length).toEqual(3)

    const plot1Node = RecordUtils.findNodeByPath('cluster/plot[0]')(survey, recordUpdated)
    const plot1PlotIdNode = RecordUtils.findNodeByPath('cluster/plot[0]/plot_id')(survey, recordUpdated)
    expect(Node.getValue(plot1PlotIdNode)).toBe(1)
    const plot1TreeNodes = Record.getNodeChildrenByDefUuid(plot1Node, treeDef.uuid)(recordUpdated)
    expect(plot1TreeNodes.length).toEqual(4)
  })
})
