import { uuidv4 } from '@core/uuid'

import * as Survey from '@core/survey/survey'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as NodeDefLayoutUpdater from '@core/survey/nodeDefLayoutUpdater'

import { getContextUser } from '../../integration/config/context'

import * as DataTest from '../../utils/dataTest'

const FORM_IN_NEW_PAGE_NAME = 'form_in_new_page'

let survey = {}

describe('NodeDefLayoutUpdater Test', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = DataTest.createTestSurvey({ user })
  }, 10000)

  it('Layout initialized', () => {
    // expect(survey).toStrictEqual({})
    const cluster = Survey.getNodeDefByName('cluster')(survey)
    const indexChildren = NodeDefLayout.getIndexChildren(Survey.cycleOneKey)(cluster)

    expect(indexChildren).toBeDefined()

    const plot = Survey.getNodeDefByName('plot')(survey)
    expect(indexChildren).toStrictEqual([plot.uuid])
  })

  it('Index children upated on node def insert', () => {
    const cluster = Survey.getNodeDefByName('cluster')(survey)
    const plot = Survey.getNodeDefByName('plot')(survey)

    const cycle = Survey.cycleOneKey
    const nodeDef = {
      uuid: uuidv4(),
      parentUuid: cluster.uuid,
      props: {
        name: FORM_IN_NEW_PAGE_NAME,
        multiple: true,
        cycles: [cycle],
        layout: {
          [cycle]: {
            [NodeDefLayout.keys.renderType]: NodeDefLayout.renderType.form,
            [NodeDefLayout.keys.pageUuid]: uuidv4(),
          },
        },
      },
    }
    survey = Survey.assocNodeDef({ nodeDef })(survey)

    const clusterUpdated = NodeDefLayoutUpdater.updateParentLayout({
      survey,
      nodeDef,
      cyclesAdded: [cycle],
    })
    const indexChildren = NodeDefLayout.getIndexChildren(Survey.cycleOneKey)(clusterUpdated)

    expect(indexChildren).toStrictEqual([plot.uuid, nodeDef.uuid])
  })

  it('Index children updated on node def delete', () => {
    const cycle = Survey.cycleOneKey

    const plot = Survey.getNodeDefByName('plot')(survey)
    const nodeDef = Survey.getNodeDefByName(FORM_IN_NEW_PAGE_NAME)(survey)
    const nodeDefUpdated = { ...nodeDef, deleted: true }

    const surveyUpdated = Survey.assocNodeDef({ nodeDef: nodeDefUpdated })(survey)
    const clusterUpdated = NodeDefLayoutUpdater.updateParentLayout({
      survey: surveyUpdated,
      nodeDef: nodeDefUpdated,
      cyclesDeleted: [cycle],
    })
    const indexChildren = NodeDefLayout.getIndexChildren(Survey.cycleOneKey)(clusterUpdated)

    expect(indexChildren).toStrictEqual([plot.uuid])
  })
})
