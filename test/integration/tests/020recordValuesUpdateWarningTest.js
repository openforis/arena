import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import { checkPublishRecordValuesUpdateWarning } from '@server/modules/survey/service/surveyService'

import { getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'

// checkPublishRecordValuesUpdateWarning must report not only the node def whose default value/
// applicable expression is directly edited in the draft, but every node def that would be recalculated
// in cascade because of it - through a chain of "default values" expressions, and through an
// "applicable" expression whose becoming-applicable/not-applicable in turn triggers a default value
// evaluation/clear (see surveyService.js _findTransitiveValueUpdateDependentUuids).
//
// Dependency shape built below (all published):
//   num --defaultValues--> num_double --defaultValues--> num_double_square
//   num --applicable-----> num_flag   --defaultValues--> num_flag_note
//   unrelated (no dependency on num at all)

const entityName = 'cluster'

let survey = null

const _fetchDraftSurvey = async (surveyId) =>
  SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
    surveyId,
    cycle: Survey.cycleOneKey,
    draft: true,
    advanced: true,
  })

describe('checkPublishRecordValuesUpdateWarning - transient dependencies', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = await SB.survey(
      user,
      SB.entity(
        entityName,
        SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(),
        SB.attribute('num', NodeDef.nodeDefType.decimal).defaultValues(
          NodeDefExpression.createExpression({ expression: '0' })
        ),
        SB.attribute('num_double', NodeDef.nodeDefType.decimal)
          .readOnly()
          .defaultValues(NodeDefExpression.createExpression({ expression: 'num * 2' })),
        SB.attribute('num_double_square', NodeDef.nodeDefType.integer)
          .readOnly()
          .defaultValues(NodeDefExpression.createExpression({ expression: 'num_double * num_double' })),
        SB.attribute('num_flag', NodeDef.nodeDefType.text).applyIf('num > 0'),
        SB.attribute('num_flag_note', NodeDef.nodeDefType.text)
          .readOnly()
          .defaultValues(NodeDefExpression.createExpression({ expression: 'num_flag' })),
        SB.attribute('unrelated', NodeDef.nodeDefType.text)
      )
    ).buildAndStore()

    // At least one record must exist, or checkPublishRecordValuesUpdateWarning short-circuits to null.
    await RB.record(user, survey, RB.entity(entityName, RB.attribute('cluster_no', 1))).buildAndStore()
  })

  afterAll(async () => {
    if (survey) {
      await SurveyManager.deleteSurvey(Survey.getId(survey))
    }
  })

  test('editing a root attribute default value reports every node def updated in cascade', async () => {
    const user = getContextUser()
    const surveyId = Survey.getId(survey)

    const surveyDraft = await _fetchDraftSurvey(surveyId)
    const numDef = Survey.getNodeDefByName('num')(surveyDraft)

    await NodeDefManager.updateNodeDefProps({
      user,
      survey: surveyDraft,
      nodeDefUuid: NodeDef.getUuid(numDef),
      parentUuid: NodeDef.getParentUuid(numDef),
      propsAdvanced: {
        [NodeDef.keysPropsAdvanced.defaultValues]: [NodeDefExpression.createExpression({ expression: '1' })],
      },
    })

    const warning = await checkPublishRecordValuesUpdateWarning({ surveyId })

    expect(warning).not.toBeNull()
    expect(warning.attributeNames.sort()).toEqual(
      ['num', 'num_double', 'num_double_square', 'num_flag', 'num_flag_note'].sort()
    )
  })
})
