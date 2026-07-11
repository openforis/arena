import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as SB from '../../utils/surveyBuilder'
import { getContextUser } from '../../integration/config/context'

describe('Survey.cloneNodeDef - meta hierarchy', () => {
  let user

  beforeAll(() => {
    user = getContextUser()
  })

  it('sets a meta hierarchy on cloned descendants that recognizes them as descendants of the cloned root', async () => {
    const survey = await SB.survey(
      user,
      SB.entity('root', SB.entity('plot', SB.attribute('plot_code', NodeDef.nodeDefType.code).category('cat_a')))
    )
      .categories(SB.category('cat_a'))
      .build()

    const root = Survey.getNodeDefRoot(survey)
    const plotDef = Survey.getNodeDefByName('plot')(survey)

    const { clonedNodeDefs } = Survey.cloneNodeDef({
      nodeDefUuid: NodeDef.getUuid(plotDef),
      targetParentNodeDefUuid: NodeDef.getUuid(root),
    })(survey)

    const clonedPlotDef = clonedNodeDefs.find(NodeDef.isEntity)
    const clonedAttributeDef = clonedNodeDefs.find((nodeDef) => !NodeDef.isEntity(nodeDef))

    expect(NodeDef.isDescendantOf(clonedPlotDef)(clonedAttributeDef)).toBe(true)
  })
})
