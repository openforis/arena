import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { Schemata } from '@common/model/db'

import { getUserGroupAccessCondition } from '@server/modules/surveyRdb/repository/dataView/userGroupAccessCondition'

import * as SB from '../../utils/surveyBuilder'

const user = { uuid: 'test-data-explorer-access-checks-user' }

describe('StringUtils.quoteDouble', () => {
  test('wraps the text in double quotes', () => {
    expect(StringUtils.quoteDouble('data_tree_view')).toBe('"data_tree_view"')
  })

  test('escapes embedded double quotes', () => {
    expect(StringUtils.quoteDouble('a"b')).toBe('"a""b"')
    expect(StringUtils.quoteDouble('"a"')).toBe('"""a"""')
  })

  test('blank text is not quoted', () => {
    expect(StringUtils.quoteDouble('')).toBe('')
  })
})

describe('Survey schema names', () => {
  test.each([1, '12'])('survey id %p is accepted', (surveyId) => {
    expect(Schemata.getSchemaSurvey(surveyId)).toBe(`survey_${surveyId}`)
    expect(Schemata.getSchemaSurveyRdb(surveyId)).toBe(`survey_${surveyId}_data`)
  })

  test.each(['1; SELECT 1', '1.5', '-1', 'abc', '', null, undefined])('survey id %p is rejected', (surveyId) => {
    expect(() => Schemata.getSchemaSurvey(surveyId)).toThrow()
    expect(() => Schemata.getSchemaSurveyRdb(surveyId)).toThrow()
  })
})

describe('getUserGroupAccessCondition', () => {
  const buildSurvey = async () => {
    const survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_no', NodeDef.nodeDefType.integer).key(),
        SB.attribute('team', NodeDef.nodeDefType.text).prop(NodeDef.propKeys.qualifier, true),
        SB.attribute('region', NodeDef.nodeDefType.code).category('region').prop(NodeDef.propKeys.qualifier, true)
      )
    )
      .categories(SB.category('region').items(SB.categoryItem('north'), SB.categoryItem('south')))
      .build()
    return { ...survey, id: 1 }
  }

  test('no condition for users without qualifier restrictions', async () => {
    const survey = await buildSurvey()
    const recordUuidColumn = 'record_uuid'
    expect(getUserGroupAccessCondition({ survey, accessFilters: null, recordUuidColumn })).toBeNull()
    expect(
      getUserGroupAccessCondition({ survey, accessFilters: { own: [], readable: [] }, recordUuidColumn })
    ).toBeNull()
  })

  test('records of the own group or of the readable groups', async () => {
    const survey = await buildSurvey()
    const teamDef = Survey.getNodeDefByName('team')(survey)
    const regionDef = Survey.getNodeDefByName('region')(survey)

    const condition = getUserGroupAccessCondition({
      survey,
      accessFilters: {
        own: [
          { nodeDef: teamDef, value: 'control' },
          { nodeDef: regionDef, value: { itemUuid: 'item-north', code: 'north' } },
        ],
        readable: [[{ nodeDef: teamDef, value: 'contractor_a' }]],
      },
      recordUuidColumn: 'v.record_uuid',
    })

    const clause = condition.clause.replaceAll(/\s+/g, ' ')
    expect(clause).toContain('v.record_uuid IN ( SELECT')
    expect(clause).toContain('FROM survey_1_data."data_cluster_view"')
    expect(clause).toContain(
      'WHERE (_user_group_access_root."team" = $/userGroupQualifier0_0/ AND _user_group_access_root."region" = $/userGroupQualifier0_1/)' +
        ' OR (_user_group_access_root."team" = $/userGroupQualifier1_0/)'
    )
    // code qualifiers are compared by item code
    expect(condition.params).toEqual({
      userGroupQualifier0_0: 'control',
      userGroupQualifier0_1: 'north',
      userGroupQualifier1_0: 'contractor_a',
    })
  })
})
