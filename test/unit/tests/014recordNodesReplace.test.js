import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as RecordUtils from '../../utils/recordUtils'
import * as SurveyUtils from '../../utils/surveyUtils'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'

import { getContextUser } from '../../integration/config/context'

const { nodeDefType } = NodeDef

describe('RecordNodesUpdater (replace nodes) Test', () => {
  it('Test replace attribute in record', async () => {
    const user = getContextUser()
    const survey = SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_id', nodeDefType.integer).key(),
        SB.attribute('cluster_num', nodeDefType.integer)
      )
    ).build()

    const record = RB.record(
      user,
      survey,
      RB.entity('cluster', RB.attribute('cluster_id', 12), RB.attribute('cluster_num', 10))
    ).build()

    const clusterDef = Survey.getNodeDefRoot(survey)
    expect(clusterDef).not.toBeNull()
    const clusterNumDef = SurveyUtils.getNodeDefByPath({ survey, path: 'cluster/cluster_num' })

    const { record: recordUpdated } = await Record.updateAttributesWithValues({
      survey,
      entityDefUuid: clusterDef.uuid,
      valuesByDefUuid: {
        [clusterNumDef.uuid]: 11,
      },
    })(record)

    const { record: recordTargetMerged } = await Record.replaceUpdatedNodes({
      survey,
      recordSource: recordUpdated,
      sideEffect: false,
    })(record)

    const someIntegerAttributeUpdated = RecordUtils.findNodeByPath('cluster/cluster_num')(survey, recordTargetMerged)
    expect(Node.getValue(someIntegerAttributeUpdated)).toBe(11)
    // check that original record hasn't been modified
    const someIntegerAttributeOriginal = RecordUtils.findNodeByPath('cluster/cluster_num')(survey, record)
    expect(Node.getValue(someIntegerAttributeOriginal)).toBe(10)
  })

  it('Test create nested entities', async () => {
    const user = getContextUser()
    const survey = SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_id', nodeDefType.integer).key(),
        SB.entity(
          'plot',
          SB.attribute('plot_id', nodeDefType.integer).key(),
          SB.attribute('plot_remarks', nodeDefType.text)
        ).multiple()
      )
    ).build()

    const record = RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_id', 12),
        RB.entity('plot', RB.attribute('plot_id', 1), RB.attribute('plot_remarks', 'Plot 1 Remarks')),
        RB.entity('plot', RB.attribute('plot_id', 2), RB.attribute('plot_remarks', 'Plot 2 Remarks'))
      )
    ).build()

    const plotDef = SurveyUtils.getNodeDefByPath({ survey, path: 'cluster/plot' })
    const plotIdDef = SurveyUtils.getNodeDefByPath({ survey, path: 'cluster/plot/plot_id' })
    const plotRemarksDef = SurveyUtils.getNodeDefByPath({ survey, path: 'cluster/plot/plot_remarks' })

    // add plot 3
    const { record: recordUpdated } = await Record.updateAttributesWithValues({
      survey,
      entityDefUuid: plotDef.uuid,
      valuesByDefUuid: {
        [plotIdDef.uuid]: 3,
        [plotRemarksDef.uuid]: 'Plot 3 Remarks',
      },
      insertMissingNodes: true,
    })(record)

    const { record: recordTargetMerged } = await Record.replaceUpdatedNodes({
      survey,
      recordSource: recordUpdated,
      sideEffect: false,
    })(record)

    const plotNodeMerged = RecordUtils.findNodeByPath('cluster/plot[2]')(survey, recordTargetMerged)
    expect(plotNodeMerged).not.toBeNull()

    const plotNodeMissingInOriginalRecord = RecordUtils.findNodeByPath('cluster/plot[2]')(survey, record)
    expect(plotNodeMissingInOriginalRecord).toBeNull()
  })
})
