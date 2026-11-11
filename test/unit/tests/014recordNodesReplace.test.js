import { Surveys } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as NodeRefData from '@core/record/nodeRefData'

import * as RecordUtils from '../../utils/recordUtils'
import * as SurveyUtils from '../../utils/surveyUtils'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'

import { getContextUser } from '../../integration/config/context'

const { nodeDefType } = NodeDef

describe('RecordNodesUpdater (replace nodes) Test', () => {
  it('Test replace attribute in record', async () => {
    const user = getContextUser()
    const survey = await SB.survey(
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

    const { record: recordUpdatedRaw } = await Record.updateAttributesWithValues({
      survey,
      entityDefUuid: clusterDef.uuid,
      valuesByDefUuid: {
        [clusterNumDef.uuid]: 11,
      },
    })(record)
    // replaceUpdatedNodes only replaces a value when its dateModified is after the target's:
    // shift it into the future so the outcome doesn't depend on record and recordUpdated being
    // built within the same millisecond (they're built back-to-back, synchronously).
    const recordUpdated = RecordUtils.shiftDateModifiedIntoTheFuture(recordUpdatedRaw)

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
    const survey = await SB.survey(
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

  it('Test replace code attribute value with stale ref data in target node', async () => {
    const user = getContextUser()
    const survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_id', nodeDefType.integer).key(),
        SB.attribute('land_use', nodeDefType.code).category('land_use'),
        SB.attribute('forest_type', nodeDefType.text).applyIf(`land_use == 'forest'`)
      )
    )
      .categories(SB.category('land_use').items(SB.categoryItem('forest'), SB.categoryItem('other')))
      .build()

    const categoryUuid = Survey.getCategoryByName('land_use')(survey).uuid
    const getItem = (code) => Surveys.getCategoryItemByCodePaths({ survey, categoryUuid, codePaths: [code] })
    const forestItem = getItem('forest')
    const otherItem = getItem('other')
    const forestTypeDef = Survey.getNodeDefByName('forest_type')(survey)

    const recordTarget = RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_id', 1),
        RB.attribute('land_use', Node.newNodeValueCode({ itemUuid: forestItem.uuid })),
        RB.attribute('forest_type', 'beech')
      )
    ).build()
    // nodes fetched from the DB carry the ref data of their current value
    const landUseTarget = RecordUtils.findNodeByPath('cluster/land_use')(survey, recordTarget)
    landUseTarget[NodeRefData.keys.refData] = { [NodeRefData.keys.categoryItem]: forestItem }

    // source record (e.g. from Arena Mobile): land use changed, no ref data
    const { record: recordSourceRaw } = await Record.updateAttributesWithValues({
      survey,
      entityDefUuid: Survey.getNodeDefRoot(survey).uuid,
      valuesByDefUuid: { [landUseTarget.nodeDefUuid]: Node.newNodeValueCode({ itemUuid: otherItem.uuid }) },
    })(JSON.parse(JSON.stringify(recordTarget))) // copy with the same node uuids
    const recordSource = RecordUtils.shiftDateModifiedIntoTheFuture(recordSourceRaw)

    const { record: recordMerged } = await Record.replaceUpdatedNodes({
      survey,
      recordSource,
      sideEffect: false,
    })(recordTarget)

    const landUseMerged = RecordUtils.findNodeByPath('cluster/land_use')(survey, recordMerged)
    expect(Node.getCategoryItemUuid(landUseMerged)).toBe(otherItem.uuid)
    expect(NodeRefData.getCategoryItem(landUseMerged)).toBeUndefined()
    // relevance evaluated with the new value, not with the one in the stale ref data
    const rootMerged = RecordUtils.findNodeByPath('cluster')(survey, recordMerged)
    expect(Node.isChildApplicable(forestTypeDef.uuid)(rootMerged)).toBe(false)
  })
})
