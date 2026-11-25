import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as SB from '../../utils/surveyBuilder'

const user = { uuid: 'test-can-node-def-be-multiple-user' }

const buildSurvey = () =>
  SB.survey(
    user,
    SB.entity(
      'cluster',
      SB.attribute('cluster_id', NodeDef.nodeDefType.integer).key(),
      SB.entity(
        'plot',
        SB.attribute('plot_id', NodeDef.nodeDefType.integer).key(),
        SB.attribute('species', NodeDef.nodeDefType.taxon),
        SB.attribute('visit_date', NodeDef.nodeDefType.date)
      ).multiple()
    )
  ).build()

describe('NodeDef.canNodeDefBeMultiple', () => {
  test.each([
    ['plot', true],
    ['species', true],
    ['plot_id', true],
    ['cluster', false],
    ['visit_date', false],
  ])('%s: %s', async (nodeDefName, expected) => {
    const survey = await buildSurvey()
    const nodeDef = Survey.getNodeDefByName(nodeDefName)(survey)

    expect(NodeDef.canNodeDefBeMultiple(nodeDef)).toBe(expected)
  })
})
