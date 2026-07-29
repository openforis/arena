import * as UserGroup from '@core/user/userGroup/userGroup'
import * as UserGroupQualifier from '@core/user/userGroup/userGroupQualifier'

describe('UserGroup', () => {
  test('newUserGroup creates an empty group with props', () => {
    const group = UserGroup.newUserGroup()
    expect(UserGroup.getProps(group)).toEqual({})
    expect(UserGroup.getName(group)).toBe('')
    expect(UserGroup.getQualifiers(group)).toEqual([])
  })

  test('assocName sets the name prop', () => {
    const group = UserGroup.assocName('field_team_a')(UserGroup.newUserGroup())
    expect(UserGroup.getName(group)).toBe('field_team_a')
  })

  test('assocLabels/getLabel round-trip', () => {
    const group = UserGroup.assocLabels({ en: 'Field team A', fr: 'Equipe A' })(UserGroup.newUserGroup())
    expect(UserGroup.getLabel('en')(group)).toBe('Field team A')
    expect(UserGroup.getLabel('fr')(group)).toBe('Equipe A')
    expect(UserGroup.getLabel('es', 'default')(group)).toBe('default')
  })

  test('assocQualifiers sets the qualifiers prop', () => {
    const qualifiers = [{ name: 'region', value: 'north' }]
    const group = UserGroup.assocQualifiers(qualifiers)(UserGroup.newUserGroup())
    expect(UserGroup.getQualifiers(group)).toEqual(qualifiers)
  })

  test('getUuid/getSurveyUuid read top-level fields', () => {
    const group = { uuid: 'g-1', surveyUuid: 's-1', props: {} }
    expect(UserGroup.getUuid(group)).toBe('g-1')
    expect(UserGroup.getSurveyUuid(group)).toBe('s-1')
  })
})

describe('UserGroupQualifier', () => {
  test('newQualifier creates an empty name/value pair', () => {
    expect(UserGroupQualifier.newQualifier()).toEqual({ name: '', value: '' })
  })

  test('getName/getValue read fields', () => {
    const qualifier = { name: 'region', value: 'north' }
    expect(UserGroupQualifier.getName(qualifier)).toBe('region')
    expect(UserGroupQualifier.getValue(qualifier)).toBe('north')
  })
})
