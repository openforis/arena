import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as SB from '../../utils/surveyBuilder'

const user = { uuid: 'test-can-node-def-be-qualifier-user' }

describe('Survey.canNodeDefBeQualifier', () => {
  it('is true for a single text attribute that is a direct child of the root entity', async () => {
    const survey = await SB.survey(user, SB.entity('plot', SB.attribute('remarks', NodeDef.nodeDefType.text))).build()

    const remarksDef = Survey.getNodeDefByName('remarks')(survey)

    expect(Survey.canNodeDefBeQualifier(remarksDef)(survey)).toBe(true)
  })

  it('is true for a single code attribute that is a direct child of the root entity', async () => {
    const survey = await SB.survey(user, SB.entity('plot', SB.attribute('status', NodeDef.nodeDefType.code))).build()

    const statusDef = Survey.getNodeDefByName('status')(survey)

    expect(Survey.canNodeDefBeQualifier(statusDef)(survey)).toBe(true)
  })

  it('is false for a text attribute nested inside a non-root entity', async () => {
    const survey = await SB.survey(
      user,
      SB.entity('plot', SB.entity('subplot', SB.attribute('remarks', NodeDef.nodeDefType.text)))
    ).build()

    const remarksDef = Survey.getNodeDefByName('remarks')(survey)

    expect(Survey.canNodeDefBeQualifier(remarksDef)(survey)).toBe(false)
  })

  it('is false for a multiple text attribute that is a direct child of the root entity', async () => {
    const survey = await SB.survey(
      user,
      SB.entity('plot', SB.attribute('remarks', NodeDef.nodeDefType.text).multiple())
    ).build()

    const remarksDef = Survey.getNodeDefByName('remarks')(survey)

    expect(Survey.canNodeDefBeQualifier(remarksDef)(survey)).toBe(false)
  })

  it('is false for a decimal attribute that is a direct child of the root entity', async () => {
    const survey = await SB.survey(user, SB.entity('plot', SB.attribute('height', NodeDef.nodeDefType.decimal))).build()

    const heightDef = Survey.getNodeDefByName('height')(survey)

    expect(Survey.canNodeDefBeQualifier(heightDef)(survey)).toBe(false)
  })
})
