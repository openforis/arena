import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import * as SurveyValidator from '@core/survey/surveyValidator'
import * as Validation from '@core/validation/validation'
import * as SB from '../../utils/surveyBuilder'

const user = { uuid: 'test-root-key-reserved-word-user' }

const { text } = NodeDef.nodeDefType

const reservedWordKey = Validation.messageKeys.nodeDefEdit.nameCannotBeRootKeyReservedWord

const getNameErrorKeys = async ({ survey, name }) => {
  const nodeDef = Survey.getNodeDefByName(name)(survey)
  const validation = await SurveyValidator.validateNodeDef(survey, nodeDef)
  const nameValidation = Validation.getFieldValidation(NodeDef.propKeys.name)(validation)
  return Validation.getErrors(nameValidation).map((error) => error.key)
}

describe('Node def name: reserved words for root key and qualifier attributes', () => {
  test.each(['cycle', 'info', 'validation', 'preview', 'owner_name', 'survey_uuid'])(
    'root key attribute named %p is invalid',
    async (name) => {
      const survey = await SB.survey(user, SB.entity('cluster', SB.attribute(name, text).key())).build()
      expect(await getNameErrorKeys({ survey, name })).toContain(reservedWordKey)
    }
  )

  test('qualifier attribute in a single entity of the root entity is invalid', async () => {
    const survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_id', text).key(),
        SB.entity('details', SB.attribute('info', text).prop(NodeDef.propKeys.qualifier, true))
      )
    ).build()
    expect(await getNameErrorKeys({ survey, name: 'info' })).toContain(reservedWordKey)
  })

  test.each([
    ['root key named survey_id (handled by reading the key values from keysObj)', 'survey_id', true],
    ['root non-key attribute', 'info', false],
  ])('%s is valid', async (_description, name, key) => {
    const attributeBuilder = SB.attribute(name, text)
    const survey = await SB.survey(
      user,
      SB.entity('cluster', SB.attribute('cluster_id', text).key(), key ? attributeBuilder.key() : attributeBuilder)
    ).build()
    expect(await getNameErrorKeys({ survey, name })).not.toContain(reservedWordKey)
  })

  test('key attribute of a multiple entity is valid', async () => {
    const survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_id', text).key(),
        SB.entity('plot', SB.attribute('cycle', text).key()).multiple()
      )
    ).build()
    expect(await getNameErrorKeys({ survey, name: 'cycle' })).not.toContain(reservedWordKey)
  })

  test.each(['ancestor_uuid', 'record_owner_uuid'])('data table column name %p cannot be used', async (name) => {
    const survey = await SB.survey(
      user,
      SB.entity('cluster', SB.attribute('cluster_id', text).key(), SB.attribute(name, text))
    ).build()
    expect(await getNameErrorKeys({ survey, name })).toContain(Validation.messageKeys.nameCannotBeKeyword)
  })
})
