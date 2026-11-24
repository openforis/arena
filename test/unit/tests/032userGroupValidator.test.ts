import * as UserGroup from '@core/user/userGroup/userGroup'
import { validateUserGroup, validateUserGroupQualifier } from '@core/user/userGroup/userGroupValidator'
import * as Validation from '@core/validation/validation'

describe('userGroupValidator: validateUserGroup', () => {
  test('valid group with unique name passes', async () => {
    const group = UserGroup.assocName('field_team_a')(UserGroup.newUserGroup())
    const validation = await validateUserGroup(group, [])
    expect(Validation.isValid(validation)).toBe(true)
  })

  test('empty name fails as required', async () => {
    const group = UserGroup.newUserGroup()
    const validation = await validateUserGroup(group, [])
    expect(Validation.isValid(validation)).toBe(false)
  })

  test('invalid name format fails', async () => {
    const group = UserGroup.assocName('Field Team A!')(UserGroup.newUserGroup())
    const validation = await validateUserGroup(group, [])
    expect(Validation.isValid(validation)).toBe(false)
  })

  test('duplicate name (case sensitive on the raw prop) fails', async () => {
    const other = UserGroup.assocName('field_team_a')(UserGroup.newUserGroup())
    const group = UserGroup.assocName('field_team_a')(UserGroup.newUserGroup())
    const validation = await validateUserGroup(group, [other])
    expect(Validation.isValid(validation)).toBe(false)
  })

  test('duplicate qualifier keys make the whole group invalid, not just the qualifiers field', async () => {
    const group = UserGroup.assocQualifiers([
      { name: 'region', value: 'north' },
      { name: 'region', value: 'south' },
    ])(UserGroup.assocName('field_team_a')(UserGroup.newUserGroup()))
    const validation = await validateUserGroup(group, [])
    expect(Validation.isValid(validation)).toBe(false)
  })

  test('valid unique qualifiers do not affect overall validity', async () => {
    const group = UserGroup.assocQualifiers([
      { name: 'region', value: 'north' },
      { name: 'unit', value: 'a' },
    ])(UserGroup.assocName('field_team_a')(UserGroup.newUserGroup()))
    const validation = await validateUserGroup(group, [])
    expect(Validation.isValid(validation)).toBe(true)
  })
})

describe('userGroupValidator: validateUserGroupQualifier', () => {
  test('valid unique qualifier passes', async () => {
    const qualifier = { name: 'region', value: 'north' }
    const validation = await validateUserGroupQualifier({ qualifier, qualifiers: [qualifier] })
    expect(Validation.isValid(validation)).toBe(true)
  })

  test('empty qualifier name fails', async () => {
    const qualifier = { name: '', value: 'north' }
    const validation = await validateUserGroupQualifier({ qualifier, qualifiers: [qualifier] })
    expect(Validation.isValid(validation)).toBe(false)
  })

  test('duplicate qualifier name fails', async () => {
    const qualifierA = { name: 'region', value: 'north' }
    const qualifierB = { name: 'region', value: 'south' }
    const validation = await validateUserGroupQualifier({
      qualifier: qualifierB,
      qualifiers: [qualifierA, qualifierB],
    })
    expect(Validation.isValid(validation)).toBe(false)
  })
})
