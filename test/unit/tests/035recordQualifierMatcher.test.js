import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import { recordMatchesQualifierFilters } from '@server/modules/record/manager/_recordManager/recordQualifierMatcher'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'

const user = { uuid: 'test-record-qualifier-matcher-user' }

const buildSurvey = async () =>
  SB.survey(
    user,
    SB.entity(
      'plot',
      SB.attribute('team', NodeDef.nodeDefType.text),
      SB.attribute('status', NodeDef.nodeDefType.code).category('team_status')
    )
  )
    .categories(SB.category('team_status').items(SB.categoryItem('A'), SB.categoryItem('B')))
    .build()

describe('recordMatchesQualifierFilters', () => {
  it('is true when there are no qualifier filters (unrestricted)', async () => {
    const survey = await buildSurvey()
    const record = RB.record(user, survey, RB.entity('plot', RB.attribute('team', 'north'))).build()

    expect(recordMatchesQualifierFilters({ survey, record, qualifierFilters: [] })).toBe(true)
  })

  it('is true when a text qualifier value matches the record', async () => {
    const survey = await buildSurvey()
    const teamDef = Survey.getNodeDefByName('team')(survey)
    const record = RB.record(user, survey, RB.entity('plot', RB.attribute('team', 'north'))).build()

    expect(
      recordMatchesQualifierFilters({ survey, record, qualifierFilters: [{ nodeDef: teamDef, value: 'north' }] })
    ).toBe(true)
  })

  it('is false when a text qualifier value does not match the record', async () => {
    const survey = await buildSurvey()
    const teamDef = Survey.getNodeDefByName('team')(survey)
    const record = RB.record(user, survey, RB.entity('plot', RB.attribute('team', 'north'))).build()

    expect(
      recordMatchesQualifierFilters({ survey, record, qualifierFilters: [{ nodeDef: teamDef, value: 'south' }] })
    ).toBe(false)
  })

  it('is true when a code qualifier value matches the record', async () => {
    const survey = await buildSurvey()
    const statusDef = Survey.getNodeDefByName('status')(survey)
    const record = RB.record(
      user,
      survey,
      RB.entity('plot', RB.attribute('status', Node.newNodeValueCode({ code: 'A' })))
    ).build()

    expect(
      recordMatchesQualifierFilters({ survey, record, qualifierFilters: [{ nodeDef: statusDef, value: 'A' }] })
    ).toBe(true)
  })

  it('is false when a code qualifier value does not match the record', async () => {
    const survey = await buildSurvey()
    const statusDef = Survey.getNodeDefByName('status')(survey)
    const record = RB.record(
      user,
      survey,
      RB.entity('plot', RB.attribute('status', Node.newNodeValueCode({ code: 'A' })))
    ).build()

    expect(
      recordMatchesQualifierFilters({ survey, record, qualifierFilters: [{ nodeDef: statusDef, value: 'B' }] })
    ).toBe(false)
  })

  it('is true when the qualifier attribute node is missing from the record (not yet auto-filled)', async () => {
    const survey = await buildSurvey()
    const teamDef = Survey.getNodeDefByName('team')(survey)
    const record = RB.record(user, survey, RB.entity('plot')).build()

    expect(
      recordMatchesQualifierFilters({ survey, record, qualifierFilters: [{ nodeDef: teamDef, value: 'north' }] })
    ).toBe(true)
  })

  it('is true when the qualifier attribute node exists but has no value yet (not yet auto-filled)', async () => {
    const survey = await buildSurvey()
    const teamDef = Survey.getNodeDefByName('team')(survey)
    const record = RB.record(user, survey, RB.entity('plot', RB.attribute('team'))).build()

    expect(
      recordMatchesQualifierFilters({ survey, record, qualifierFilters: [{ nodeDef: teamDef, value: 'north' }] })
    ).toBe(true)
  })

  it('is false when pendingNode sets the qualifier attribute to a value outside the qualifier filters', async () => {
    const survey = await buildSurvey()
    const teamDef = Survey.getNodeDefByName('team')(survey)
    const record = RB.record(user, survey, RB.entity('plot', RB.attribute('team', 'north'))).build()
    const rootNode = Record.getRootNode(record)
    const pendingNode = Node.newNode(NodeDef.getUuid(teamDef), Record.getUuid(record), rootNode, 'south')

    expect(
      recordMatchesQualifierFilters({
        survey,
        record,
        qualifierFilters: [{ nodeDef: teamDef, value: 'north' }],
        pendingNode,
      })
    ).toBe(false)
  })

  it('is true when pendingNode sets the qualifier attribute to a value matching the qualifier filters', async () => {
    const survey = await buildSurvey()
    const teamDef = Survey.getNodeDefByName('team')(survey)
    const record = RB.record(user, survey, RB.entity('plot')).build()
    const rootNode = Record.getRootNode(record)
    const pendingNode = Node.newNode(NodeDef.getUuid(teamDef), Record.getUuid(record), rootNode, 'north')

    expect(
      recordMatchesQualifierFilters({
        survey,
        record,
        qualifierFilters: [{ nodeDef: teamDef, value: 'north' }],
        pendingNode,
      })
    ).toBe(true)
  })

  it('is true when pendingNode is unrelated to the qualifier attribute and the record already matches', async () => {
    const survey = await buildSurvey()
    const teamDef = Survey.getNodeDefByName('team')(survey)
    const statusDef = Survey.getNodeDefByName('status')(survey)
    const record = RB.record(user, survey, RB.entity('plot', RB.attribute('team', 'north'))).build()
    const rootNode = Record.getRootNode(record)
    const pendingNode = Node.newNode(NodeDef.getUuid(statusDef), Record.getUuid(record), rootNode, null)

    expect(
      recordMatchesQualifierFilters({
        survey,
        record,
        qualifierFilters: [{ nodeDef: teamDef, value: 'north' }],
        pendingNode,
      })
    ).toBe(true)
  })
})
