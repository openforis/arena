import en from '@core/i18n/resources/en'

import {
  applyPolicyChoice,
  getLevelsAbove,
  getPolicyLevelOptions,
} from '@webapp/views/App/views/Home/SurveyInfo/SurveyAiPolicyEditor/policyLevelOptions'

const disabledKeys = (options: { key: string; disabled: boolean }[]) =>
  options.filter((o) => o.disabled).map((o) => o.key)

describe('survey AI policy editor: data never above schema (361)', () => {
  test('getLevelsAbove lists the levels above one', () => {
    expect(getLevelsAbove('onDevice')).toEqual(['orgHosted', 'cloud'])
    expect(getLevelsAbove('cloud')).toEqual([])
  })

  test('the data class cannot choose a level above the schema level', () => {
    const options = getPolicyLevelOptions({ ceiling: 'cloud', readOnly: false, limit: 'onDevice' })
    expect(disabledKeys(options)).toEqual(['orgHosted', 'cloud'])
  })

  test('the ceiling and the schema limit add up', () => {
    const options = getPolicyLevelOptions({ ceiling: 'off', readOnly: false, limit: 'cloud' })
    expect(disabledKeys(options)).toEqual(['onDevice', 'orgHosted', 'cloud'])
    expect(disabledKeys(getPolicyLevelOptions({ ceiling: 'orgHosted', readOnly: false, limit: 'onDevice' }))).toEqual([
      'orgHosted',
      'cloud',
    ])
  })

  test('without a limit nothing else is disabled', () => {
    expect(disabledKeys(getPolicyLevelOptions({ ceiling: 'cloud', readOnly: false }))).toEqual([])
  })

  test('lowering the schema below the data lowers the data too', () => {
    expect(
      applyPolicyChoice({ policy: { schema: 'cloud', data: 'cloud' }, dataClass: 'schema', level: 'off' })
    ).toEqual({
      policy: { schema: 'off', data: 'off' },
      dataLowered: true,
    })
  })

  test('lowering the schema to the data level or above keeps the data', () => {
    expect(
      applyPolicyChoice({ policy: { schema: 'cloud', data: 'onDevice' }, dataClass: 'schema', level: 'orgHosted' })
    ).toEqual({ policy: { schema: 'orgHosted', data: 'onDevice' }, dataLowered: false })
  })

  test('a data choice above the schema is refused by clamping (the buttons are disabled anyway)', () => {
    expect(
      applyPolicyChoice({ policy: { schema: 'onDevice', data: 'off' }, dataClass: 'data', level: 'cloud' })
    ).toEqual({ policy: { schema: 'onDevice', data: 'onDevice' }, dataLowered: true })
  })

  test('raising the schema never changes the data', () => {
    expect(applyPolicyChoice({ policy: { schema: 'off', data: 'off' }, dataClass: 'schema', level: 'cloud' })).toEqual({
      policy: { schema: 'cloud', data: 'off' },
      dataLowered: false,
    })
  })

  test('the new editor texts exist in English', () => {
    const texts = en.homeView.surveyInfo.aiPolicy as Record<string, unknown>
    expect(typeof texts.dataLimitedBySchema).toBe('string')
    expect(typeof texts.savedDataLowered).toBe('string')
  })
})
