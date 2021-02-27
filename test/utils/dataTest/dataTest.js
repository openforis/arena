import * as NodeDef from '@core/survey/nodeDef'

import * as SB from '../surveyBuilder'
import * as RB from '../recordBuilder'

export const createTestSurvey = ({ user }) =>
  SB.survey(
    user,
    SB.entity(
      'cluster',
      SB.attribute('cluster_id', NodeDef.nodeDefType.integer).key(),
      SB.attribute('cluster_distance', NodeDef.nodeDefType.integer),
      SB.attribute('visit_date', NodeDef.nodeDefType.date),
      SB.attribute('gps_model', NodeDef.nodeDefType.text),
      SB.attribute('remarks', NodeDef.nodeDefType.text),
      SB.entity(
        'plot',
        SB.attribute('plot_id', NodeDef.nodeDefType.integer).key(),
        SB.attribute('plot_multiple_number', NodeDef.nodeDefType.integer).multiple(),
        SB.entity(
          'tree',
          SB.attribute('tree_id', NodeDef.nodeDefType.integer).key(),
          SB.attribute('tree_height', NodeDef.nodeDefType.integer),
          SB.attribute('dbh', NodeDef.nodeDefType.decimal)
        ).multiple()
      ).multiple()
    )
  ).build()

export const createTestRecord = ({ user, survey }) =>
  RB.record(
    user,
    survey,
    RB.entity(
      'cluster',
      RB.attribute('cluster_id', 12),
      RB.attribute('cluster_distance', 18),
      RB.attribute('visit_date', '2021-01-01'),
      RB.attribute('gps_model', 'ABC-123-xyz'),
      RB.attribute('remarks', ''),
      RB.entity(
        'plot',
        RB.attribute('plot_id', 1),
        RB.attribute('plot_multiple_number', 10),
        RB.attribute('plot_multiple_number', 20),
        RB.entity('tree', RB.attribute('tree_id', 1), RB.attribute('tree_height', 10), RB.attribute('dbh', 7)),
        RB.entity('tree', RB.attribute('tree_id', 2), RB.attribute('tree_height', 11), RB.attribute('dbh', 10.123))
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
        RB.attribute('plot_multiple_number', 30),
        RB.entity('tree', RB.attribute('tree_id', 1), RB.attribute('tree_height', 13), RB.attribute('dbh', 19)),
        RB.entity('tree', RB.attribute('tree_id', 2), RB.attribute('tree_height', 10), RB.attribute('dbh', 15)),
        RB.entity('tree', RB.attribute('tree_id', 3), RB.attribute('tree_height', 11), RB.attribute('dbh', 16)),
        RB.entity('tree', RB.attribute('tree_id', 4), RB.attribute('tree_height', 10), RB.attribute('dbh', 7)),
        RB.entity('tree', RB.attribute('tree_id', 5), RB.attribute('tree_height', 33), RB.attribute('dbh', 22))
      )
    )
  ).build()
