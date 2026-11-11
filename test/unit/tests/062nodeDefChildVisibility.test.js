import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefLayout from '@core/survey/nodeDefLayout'
import * as Node from '@core/record/node'

import { isChildHiddenWhenNotRelevant } from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefChildVisibility'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as RecordUtils from '../../utils/recordUtils'

const { nodeDefType } = NodeDef

const user = { uuid: 'test-node-def-child-visibility-user' }
const cycle = Survey.cycleOneKey

describe('Form: not relevant fields hidden when not relevant', () => {
  const setup = async ({ forestTypeValue }) => {
    const survey = await SB.survey(
      user,
      SB.entity(
        'plot',
        SB.attribute('plot_id', nodeDefType.integer).key(),
        SB.attribute('forest_type', nodeDefType.text)
      )
    ).build()
    const forestTypeDef = NodeDef.updateLayout(NodeDefLayout.assocLayoutProp(cycle, 'hiddenWhenNotRelevant', true))(
      Survey.getNodeDefByName('forest_type')(survey)
    )
    const record = RB.record(
      user,
      survey,
      RB.entity('plot', RB.attribute('plot_id', 1), RB.attribute('forest_type', forestTypeValue))
    ).build()
    const plot = RecordUtils.findNodeByPath('plot')(survey, record)
    const plotNotRelevant = Node.assocChildApplicability({ nodeDefUuid: forestTypeDef.uuid, applicable: false })(plot)
    return { forestTypeDef, record, plot, plotNotRelevant }
  }

  it('relevant field is visible', async () => {
    const { forestTypeDef, record, plot } = await setup({ forestTypeValue: null })
    expect(isChildHiddenWhenNotRelevant({ cycle, record, parentNode: plot, childDef: forestTypeDef })).toBe(false)
  })

  it('not relevant empty field is hidden', async () => {
    const { forestTypeDef, record, plotNotRelevant } = await setup({ forestTypeValue: null })
    expect(isChildHiddenWhenNotRelevant({ cycle, record, parentNode: plotNotRelevant, childDef: forestTypeDef })).toBe(
      true
    )
  })

  it('not relevant field with a value is visible', async () => {
    const { forestTypeDef, record, plotNotRelevant } = await setup({ forestTypeValue: 'beech' })
    expect(isChildHiddenWhenNotRelevant({ cycle, record, parentNode: plotNotRelevant, childDef: forestTypeDef })).toBe(
      false
    )
  })
})
