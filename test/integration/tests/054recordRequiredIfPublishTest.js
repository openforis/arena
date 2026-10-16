import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as NodeDefManager from '@server/modules/nodeDef/manager/nodeDefManager'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import { getContextUser } from '../config/context'

import * as SB from '../../utils/surveyBuilder'
import * as RB from '../../utils/recordBuilder'
import * as SurveyUtils from '../../utils/surveyUtils'
import * as RecordUtils from '../../utils/recordUtils'

// Publishing a survey after adding (or removing) a "required if" condition must recompute the
// "required if" flags (parent node meta cReq) of the existing records and re-validate the attributes.

const entityName = 'plot'
const remarksDefName = 'remarks'

let survey = null
let record = null

const _fetchDraftSurvey = async (surveyId) =>
  Survey.buildAndAssocDependencyGraph(
    await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
      surveyId,
      cycle: Survey.cycleOneKey,
      draft: true,
      advanced: true,
    })
  )

const _fetchPublishedSurveyAndRecord = async () => {
  const surveyId = Survey.getId(survey)
  const surveyPublished = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({
    surveyId,
    cycle: Survey.cycleOneKey,
    draft: false,
    advanced: true,
  })
  const recordReloaded = await RecordManager.fetchRecordAndNodesByUuid({
    surveyId,
    recordUuid: Record.getUuid(record),
    includeSurveyUuid: false,
    includeRecordUuid: false,
  })
  return { surveyPublished, recordReloaded }
}

const _updateValidationsAndPublish = async ({ nodeDefName, validationsUpdater }) => {
  const user = getContextUser()
  const surveyId = Survey.getId(survey)
  const surveyDraft = await _fetchDraftSurvey(surveyId)
  const nodeDef = Survey.getNodeDefByName(nodeDefName)(surveyDraft)

  await NodeDefManager.updateNodeDefProps({
    user,
    survey: surveyDraft,
    nodeDefUuid: NodeDef.getUuid(nodeDef),
    parentUuid: NodeDef.getParentUuid(nodeDef),
    propsAdvanced: { [NodeDef.keysPropsAdvanced.validations]: validationsUpdater(NodeDef.getValidations(nodeDef)) },
  })
  await SurveyUtils.publishSurvey(user, surveyId)
  return _fetchPublishedSurveyAndRecord()
}

const _updateRemarksRequiredIfAndPublish = async (requiredIf) =>
  _updateValidationsAndPublish({
    nodeDefName: remarksDefName,
    validationsUpdater: NodeDefValidations.assocRequiredIf(requiredIf),
  })

const _getRemarksState = ({ surveyPublished, recordReloaded }) => {
  const remarksDef = Survey.getNodeDefByName(remarksDefName)(surveyPublished)
  const remarksNode = RecordUtils.findNodeByPath(`${entityName}/${remarksDefName}`)(surveyPublished, recordReloaded)
  const plotNode = Record.getParentNode(remarksNode)(recordReloaded)
  const remarksValidation = Validation.getFieldValidation(Node.getUuid(remarksNode))(
    Record.getValidation(recordReloaded)
  )
  return {
    remarksDefUuid: NodeDef.getUuid(remarksDef),
    plotMeta: Node.getMeta(plotNode),
    required: Node.isChildRequired(NodeDef.getUuid(remarksDef))(plotNode),
    valid: Validation.isValid(remarksValidation),
  }
}

const _isNodeValid = ({ surveyPublished, recordReloaded, nodeDefName }) => {
  const node = RecordUtils.findNodeByPath(`${entityName}/${nodeDefName}`)(surveyPublished, recordReloaded)
  return Validation.isValid(Validation.getFieldValidation(Node.getUuid(node))(Record.getValidation(recordReloaded)))
}

describe('Required if - survey publish', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = await SB.survey(
      user,
      SB.entity(
        entityName,
        SB.attribute('plot_no', NodeDef.nodeDefType.integer).key(),
        SB.attribute('land_use', NodeDef.nodeDefType.integer),
        SB.attribute(remarksDefName, NodeDef.nodeDefType.text)
      )
    ).buildAndStore()

    record = await RB.record(
      user,
      survey,
      RB.entity(entityName, RB.attribute('plot_no', 1), RB.attribute('land_use', 1), RB.attribute(remarksDefName, null))
    ).buildAndStore()

    await SurveyUtils.publishSurvey(user, Survey.getId(survey))
  })

  afterAll(async () => {
    if (survey) {
      await SurveyManager.deleteSurvey(Survey.getId(survey))
    }
  })

  test('Adding a condition met in an existing record sets the flag and the "value required" error', async () => {
    const requiredIf = [NodeDefExpression.createExpression({ expression: 'land_use == 1' })]
    const state = _getRemarksState(await _updateRemarksRequiredIfAndPublish(requiredIf))

    expect(state.required).toBe(true)
    expect(state.plotMeta[Node.metaKeys.childRequired]).toEqual({ [state.remarksDefUuid]: true })
    expect(state.valid).toBe(false)
  })

  test('Removing the condition clears the flag (not stored when empty) and the error', async () => {
    const state = _getRemarksState(await _updateRemarksRequiredIfAndPublish([]))

    expect(state.required).toBe(false)
    expect(state.plotMeta[Node.metaKeys.childRequired]).toBeUndefined()
    expect(state.valid).toBe(true)
  })

  test('Changing only the validation expressions re-validates the existing attributes', async () => {
    const validationsUpdater = (expression) =>
      NodeDefValidations.assocExpressions([NodeDefExpression.createExpression({ expression })])
    let result = await _updateValidationsAndPublish({
      nodeDefName: 'land_use',
      validationsUpdater: validationsUpdater('land_use > 5'),
    })
    expect(_isNodeValid({ ...result, nodeDefName: 'land_use' })).toBe(false)

    result = await _updateValidationsAndPublish({
      nodeDefName: 'land_use',
      validationsUpdater: validationsUpdater('land_use > 0'),
    })
    expect(_isNodeValid({ ...result, nodeDefName: 'land_use' })).toBe(true)
  })
})
