import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { checkAttributeEditable, checkRecordEditable } from '@webapp/ai/tools/cleaning/recordEditPermissions'

import {
  cleaningAdminUser,
  cleaningTestRecord,
  cleaningTestSurvey,
  newCleaningSurveyUser,
} from '@test/unit/utils/aiCleaningTestUtils'

let survey: any

const withProps = (nodeDef: any, props: Record<string, unknown>) => ({
  ...nodeDef,
  [NodeDef.keys.props]: { ...NodeDef.getProps(nodeDef), ...props },
})

const unpublished = (published: any) => {
  const info = Survey.getSurveyInfo(published)
  return published.info ? { ...published, info: { ...info, published: false } } : { ...published, published: false }
}

beforeAll(async () => {
  survey = await cleaningTestSurvey()
})

describe('checkRecordEditable', () => {
  const refusalCode = (user: any, record: any, aSurvey = survey) =>
    checkRecordEditable({ user, survey: aSurvey, record })?.code ?? null

  test('a system admin and a data cleanser can edit records in entry and cleansing', () => {
    const cleanser = newCleaningSurveyUser({ survey, groupName: 'dataCleanser' })
    for (const step of ['1', '2']) {
      expect(refusalCode(cleaningAdminUser, cleaningTestRecord({ survey, step }))).toBeNull()
      expect(refusalCode(cleanser, cleaningTestRecord({ survey, step }))).toBeNull()
    }
  })

  test('nobody edits a record in the analysis step', () => {
    const cleanser = newCleaningSurveyUser({ survey, groupName: 'dataCleanser' })
    expect(refusalCode(cleanser, cleaningTestRecord({ survey, step: '3' }))).toBe('recordNotEditable')
    expect(refusalCode(cleaningAdminUser, cleaningTestRecord({ survey, step: '3' }))).toBe('recordNotEditable')
  })

  test('a data editor edits only its own records in entry', () => {
    const editor = newCleaningSurveyUser({ survey, groupName: 'dataEditor', uuid: 'editor' })
    expect(refusalCode(editor, cleaningTestRecord({ survey, ownerUuid: 'editor' }))).toBeNull()
    expect(refusalCode(editor, cleaningTestRecord({ survey, ownerUuid: 'someone' }))).toBe('recordNotEditable')
    expect(refusalCode(editor, cleaningTestRecord({ survey, step: '2', ownerUuid: 'editor' }))).toBe(
      'recordNotEditable'
    )
  })

  test('the survey uuid of the record comes from the survey (GET /record has none)', () => {
    const cleanser = newCleaningSurveyUser({ survey, groupName: 'dataCleanser' })
    const { surveyUuid, ...recordWithoutSurvey } = cleaningTestRecord({ survey })
    expect(surveyUuid).toBeTruthy()
    expect(refusalCode(cleanser, recordWithoutSurvey)).toBeNull()
  })

  test('records of an unpublished survey are not edited', () => {
    expect(refusalCode(cleaningAdminUser, cleaningTestRecord({ survey }), unpublished(survey))).toBe(
      'surveyNotPublished'
    )
  })
})

describe('checkAttributeEditable', () => {
  const refusalCode = (user: any, nodeDef: any) => checkAttributeEditable({ user, survey, nodeDef })?.code ?? null
  const dbh = () => Survey.getNodeDefByName('dbh')(survey)

  test('a plain attribute is editable', () => {
    const cleanser = newCleaningSurveyUser({ survey, groupName: 'dataCleanser' })
    expect(refusalCode(cleanser, dbh())).toBeNull()
  })

  test('entities, read-only and analysis attributes are not', () => {
    expect(refusalCode(cleaningAdminUser, Survey.getNodeDefByName('tree')(survey))).toBe('attributeNotEditable')
    expect(refusalCode(cleaningAdminUser, withProps(dbh(), { [NodeDef.propKeys.readOnly]: true }))).toBe(
      'attributeNotEditable'
    )
    expect(refusalCode(cleaningAdminUser, { ...dbh(), analysis: true })).toBe('attributeNotEditable')
  })

  test('a qualifier attribute needs the qualifier permission (survey admins)', () => {
    const qualifier = withProps(dbh(), { [NodeDef.propKeys.qualifier]: true })
    const cleanser = newCleaningSurveyUser({ survey, groupName: 'dataCleanser' })
    const surveyAdmin = newCleaningSurveyUser({ survey, groupName: 'surveyAdmin' })
    expect(refusalCode(cleanser, qualifier)).toBe('qualifierNotEditable')
    expect(refusalCode(surveyAdmin, qualifier)).toBeNull()
  })
})
