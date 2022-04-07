import { uuidv4 } from '@core/uuid'
import * as Survey from '@core/survey/survey'

import { getContextUser } from '../../integration/config/context'

import * as DataTest from '../../utils/dataTest'

let survey = {}

describe('NodeDefsIndex Test', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = DataTest.createTestSurvey({ user })
  }, 10000)

  it('Index initialized', () => {
    const { nodeDefsIndex: index } = survey

    expect(index).toBeDefined()
  })

  it('cluster children', () => {
    const { nodeDefsIndex: index } = survey
    const { childDefUuidsByParentUuid } = index

    const cluster = Survey.getNodeDefByName('cluster')(survey)

    const childrenUuids = childDefUuidsByParentUuid[cluster.uuid]
    expect(childrenUuids).toBeDefined()

    const childrenNames = [
      'cluster_id',
      'cluster_location',
      'cluster_distance',
      'cluster_accessible',
      'visit_date',
      'visit_time',
      'gps_model',
      'remarks',
      'plot',
    ]
    expect(childrenUuids.length).toBe(childrenNames.length)

    childrenNames.forEach((childName) => {
      const def = Survey.getNodeDefByName(childName)(survey)
      expect(childrenUuids.includes(def.uuid)).toBeTruthy()
    })
  })

  it('plot children', () => {
    const { nodeDefsIndex: index } = survey
    const { childDefUuidsByParentUuid } = index

    const plot = Survey.getNodeDefByName('plot')(survey)

    const childrenUuids = childDefUuidsByParentUuid[plot.uuid]
    expect(childrenUuids).toBeDefined()

    const childrenNames = ['plot_id', 'plot_location', 'plot_multiple_number', 'plot_details', 'tree']
    expect(childrenUuids.length).toBe(childrenNames.length)

    childrenNames.forEach((childName) => {
      const def = Survey.getNodeDefByName(childName)(survey)
      expect(childrenUuids.includes(def.uuid)).toBeTruthy()
    })
  })

  it('add node def', () => {
    const cluster = Survey.getNodeDefByName('cluster')(survey)

    const nodeDef = { uuid: uuidv4(), parentUuid: cluster.uuid, props: { name: 'New def' } }
    const surveyUpdated = Survey.assocNodeDef({ nodeDef })(survey)

    const { nodeDefsIndex: index } = surveyUpdated
    const { childDefUuidsByParentUuid } = index

    const childrenUuids = childDefUuidsByParentUuid[cluster.uuid]
    expect(childrenUuids.length).toBe(10)
    expect(childrenUuids.includes(nodeDef.uuid)).toBeTruthy()
  })
})
