import en from '@core/i18n/resources/en'

import {
  getLevelsAbove,
  getPolicyLevelOptions,
  getPolicySaveErrorMessage,
} from '@webapp/views/App/views/Home/SurveyInfo/SurveyAiPolicyEditor/policyLevelOptions'
import { fakeT as t } from '../utils/fakeT'

const getPath = (obj: any, path: string) => path.split('.').reduce((acc, part) => acc?.[part], obj)
const disabledKeys = (options: { key: string; disabled: boolean }[]) =>
  options.filter((o) => o.disabled).map((o) => o.key)

describe('policy level options', () => {
  test('cloud ceiling: every level can be chosen', () => {
    const options = getPolicyLevelOptions({ ceiling: 'cloud', readOnly: false })
    expect(options.map((o) => o.key)).toEqual(['off', 'onDevice', 'orgHosted', 'cloud'])
    expect(disabledKeys(options)).toEqual([])
  })

  test('orgHosted ceiling: cloud is locked', () => {
    expect(disabledKeys(getPolicyLevelOptions({ ceiling: 'orgHosted', readOnly: false }))).toEqual(['cloud'])
    expect(getLevelsAbove('orgHosted')).toEqual(['cloud'])
  })

  test('off ceiling: only off', () => {
    expect(disabledKeys(getPolicyLevelOptions({ ceiling: 'off', readOnly: false }))).toEqual([
      'onDevice',
      'orgHosted',
      'cloud',
    ])
  })

  test('read only: every level disabled', () => {
    expect(disabledKeys(getPolicyLevelOptions({ ceiling: 'cloud', readOnly: true }))).toEqual([
      'off',
      'onDevice',
      'orgHosted',
      'cloud',
    ])
  })

  test('labels and hints exist in English', () => {
    for (const option of getPolicyLevelOptions({ ceiling: 'cloud', readOnly: false })) {
      expect(typeof getPath(en.common, option.label)).toBe('string')
      expect(typeof getPath(en.homeView, option.title.replace('homeView:', ''))).toBe('string')
    }
  })
})

describe('getPolicySaveErrorMessage', () => {
  test('server error key with params', () => {
    const error = {
      response: {
        data: { key: 'aiPolicyAboveCeiling', params: { dataClass: 'schema', level: 'cloud', ceiling: 'off' } },
      },
    }
    expect(getPolicySaveErrorMessage({ error, t })).toBe(
      'appErrors:aiPolicyAboveCeiling{"dataClass":"schema","level":"cloud","ceiling":"off"}'
    )
  })

  test('a namespaced key is used as is', () => {
    const error = { response: { data: { key: 'appErrors:generic', params: { text: 'x' } } } }
    expect(getPolicySaveErrorMessage({ error, t })).toBe('appErrors:generic{"text":"x"}')
  })

  test('other errors: the message', () => {
    expect(getPolicySaveErrorMessage({ error: new Error('Network Error'), t })).toBe('Network Error')
  })
})
