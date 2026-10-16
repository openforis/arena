import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as NodeDefValidations from '@core/survey/nodeDefValidations'
import * as SurveyValidator from '@core/survey/surveyValidator'
import * as Validation from '@core/validation/validation'

import * as SB from '../../utils/surveyBuilder'

const user = { uuid: 'test-required-if-user' }

const { text, integer } = NodeDef.nodeDefType

const createSurvey = (...childBuilders) => SB.survey(user, SB.entity('plot', ...childBuilders)).build()

const getRequiredIfErrorKeys = async ({ survey, name }) => {
  const nodeDef = Survey.getNodeDefByName(name)(survey)
  const validation = await SurveyValidator.validateNodeDef(survey, nodeDef)
  const requiredIfValidation = Validation.getFieldValidation(
    `${NodeDef.keysPropsAdvanced.validations}.${NodeDefValidations.keys.requiredIf}`
  )(validation)
  return Validation.getErrors(requiredIfValidation).map((error) => error.key)
}

describe('NodeDefValidations - required if', () => {
  it('assocRequiredIf stores the expressions and removes the key when empty', () => {
    const expression = NodeDefExpression.createExpression({ expression: 'true' })
    const validations = NodeDefValidations.assocRequiredIf([expression])({})
    expect(NodeDefValidations.getRequiredIf(validations)).toEqual([expression])
    expect(NodeDefValidations.isRequiredIfDefined(validations)).toBe(true)

    const validationsCleared = NodeDefValidations.assocRequiredIf([])(validations)
    expect(validationsCleared).toEqual({})
    expect(NodeDefValidations.isRequiredIfDefined(validationsCleared)).toBe(false)
  })
})

describe('Survey validation - required if', () => {
  it('valid condition on a single non-key attribute', async () => {
    const survey = await createSurvey(
      SB.attribute('plot_id', integer).key(),
      SB.attribute('land_use', integer),
      SB.attribute('remarks', text).requiredIf('land_use == 1')
    )
    expect(await getRequiredIfErrorKeys({ survey, name: 'remarks' })).toEqual([])
  })

  it('invalid condition expression', async () => {
    const survey = await createSurvey(
      SB.attribute('plot_id', integer).key(),
      SB.attribute('remarks', text).requiredIf('not_existing_attribute == 1')
    )
    expect(await getRequiredIfErrorKeys({ survey, name: 'remarks' })).toEqual([
      Validation.messageKeys.nodeDefEdit.requiredIfInvalid,
    ])
  })

  it('condition not allowed on key attributes', async () => {
    const survey = await createSurvey(
      SB.attribute('plot_id', integer).key().requiredIf('true'),
      SB.attribute('remarks', text)
    )
    expect(await getRequiredIfErrorKeys({ survey, name: 'plot_id' })).toEqual([
      Validation.messageKeys.nodeDefEdit.requiredIfNotAllowed,
    ])
  })

  it('condition not allowed together with "always required"', async () => {
    const survey = await createSurvey(
      SB.attribute('plot_id', integer).key(),
      SB.attribute('remarks', text).required().requiredIf('true')
    )
    expect(await getRequiredIfErrorKeys({ survey, name: 'remarks' })).toEqual([
      Validation.messageKeys.nodeDefEdit.requiredIfNotAllowed,
    ])
  })
})

describe('NodeDef.hasRequiredIfDraftChanged', () => {
  const requiredIf = [NodeDefExpression.createExpression({ expression: 'true' })]
  const createNodeDef = ({ published, draft }) => ({
    [NodeDef.keys.propsAdvanced]: { validations: published },
    ...(draft ? { [NodeDef.keys.propsAdvancedDraft]: { validations: draft }, draftAdvancedValidations: true } : {}),
  })

  it('false without validations draft', () => {
    expect(NodeDef.hasRequiredIfDraftChanged(createNodeDef({ published: { requiredIf } }))).toBe(false)
  })

  it('false when only other validations changed', () => {
    const nodeDef = createNodeDef({ published: { requiredIf }, draft: { requiredIf, unique: true } })
    expect(NodeDef.hasRequiredIfDraftChanged(nodeDef)).toBe(false)
  })

  it('true when the condition is added, changed or removed', () => {
    const requiredIfChanged = [NodeDefExpression.createExpression({ expression: 'false' })]
    expect(NodeDef.hasRequiredIfDraftChanged(createNodeDef({ published: {}, draft: { requiredIf } }))).toBe(true)
    expect(
      NodeDef.hasRequiredIfDraftChanged(
        createNodeDef({ published: { requiredIf }, draft: { requiredIf: requiredIfChanged } })
      )
    ).toBe(true)
    expect(NodeDef.hasRequiredIfDraftChanged(createNodeDef({ published: { requiredIf }, draft: {} }))).toBe(true)
  })
})
