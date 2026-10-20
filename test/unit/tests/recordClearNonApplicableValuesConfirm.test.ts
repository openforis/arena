import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'

import {
  getNodeDefLabelsToShow,
  prepareNodesToRestore,
} from '@webapp/store/ui/record/actions/clearNonApplicableValuesConfirmUtils'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'

const user = { uuid: 'test-user-uuid', props: {} }

let survey: any = null

const getNodeDefUuid = (name: string) => NodeDef.getUuid(Survey.getNodeDefByName(name)(survey))

describe('Record: confirm clear of non-applicable values', () => {
  beforeAll(async () => {
    survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(),
        SB.attribute('distance', NodeDef.nodeDefType.decimal),
        SB.entity('tree', SB.attribute('tree_no', NodeDef.nodeDefType.integer).key(), SB.attribute('dbh')).multiple()
      )
    ).build()
  })

  test('lists cleared multiple entities first, without the attributes inside them', () => {
    const labels = getNodeDefLabelsToShow({
      survey,
      lang: 'en',
      nodeDefUuidsToClear: [getNodeDefUuid('distance'), getNodeDefUuid('dbh'), getNodeDefUuid('tree')],
    })
    expect(labels).toEqual(['- tree', '- distance'])
  })

  test('lists attributes of multiple entities not cleared', () => {
    const labels = getNodeDefLabelsToShow({
      survey,
      lang: 'en',
      nodeDefUuidsToClear: [getNodeDefUuid('dbh'), getNodeDefUuid('distance')],
    })
    expect(labels).toEqual(['- tree / dbh', '- distance'])
  })

  test('nodes to restore are marked as dirty, so that they replace the ones being edited locally', () => {
    const record = RB.record(
      user,
      survey,
      RB.entity('cluster', RB.attribute('cluster_no', 1), RB.attribute('distance', 3))
    ).build()
    const distanceNode = RecordUtils.findNodeByPath('cluster/distance')(survey, record)

    const nodesToRestore = prepareNodesToRestore([distanceNode])

    const nodeRestored = nodesToRestore[Node.getUuid(distanceNode)]
    expect(Node.getValue(nodeRestored)).toBe(3)
    expect(Node.isDirty(nodeRestored)).toBe(true)
  })
})
