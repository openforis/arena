import {
  aiHostingClasses,
  aiPolicyLevels,
  assertHostingAllowed,
  clampAiPolicy,
  defaultAiPolicy,
  findLevelsAboveCeiling,
  getEffectiveAiPolicy,
  getPolicyLevelIndex,
  isAiPolicyLevel,
  isHostingAllowed,
  normalizeAiPolicy,
} from '@common/ai/policy'

import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

describe('policy levels', () => {
  test('are ordered off < onDevice < orgHosted < cloud', () => {
    expect(aiPolicyLevels.map(getPolicyLevelIndex)).toEqual([0, 1, 2, 3])
    expect(getPolicyLevelIndex('bogus')).toBe(-1)
    expect(getPolicyLevelIndex(null)).toBe(-1)
  })

  test('isAiPolicyLevel accepts only the four levels', () => {
    expect(aiPolicyLevels.every(isAiPolicyLevel)).toBe(true)
    for (const value of ['Cloud', '', null, undefined, 3, {}, 'unknown']) {
      expect(isAiPolicyLevel(value)).toBe(false)
    }
  })

  test('hosting classes are the levels without off', () => {
    expect([...aiHostingClasses]).toEqual(['onDevice', 'orgHosted', 'cloud'])
  })
})

describe('normalizeAiPolicy', () => {
  test('a missing policy gets the defaults', () => {
    expect(normalizeAiPolicy(undefined)).toEqual({ schema: 'cloud', data: 'onDevice' })
    expect(normalizeAiPolicy(null)).toEqual(defaultAiPolicy)
  })

  test('a missing class gets its default', () => {
    expect(normalizeAiPolicy({ data: 'cloud' })).toEqual({ schema: 'cloud', data: 'cloud' })
    expect(normalizeAiPolicy({ schema: 'off' })).toEqual({ schema: 'off', data: 'onDevice' })
    expect(normalizeAiPolicy({ schema: null, data: undefined })).toEqual(defaultAiPolicy)
  })

  test('invalid values become off (fail closed)', () => {
    expect(normalizeAiPolicy({ schema: 'everywhere', data: 3 })).toEqual({ schema: 'off', data: 'off' })
    expect(normalizeAiPolicy({ schema: 'Cloud', data: 'cloud' })).toEqual({ schema: 'off', data: 'cloud' })
  })

  test('a value that is not an object turns everything off', () => {
    for (const raw of ['cloud', 42, true, ['cloud']]) {
      expect(normalizeAiPolicy(raw)).toEqual({ schema: 'off', data: 'off' })
    }
  })

  test('extra keys are dropped', () => {
    expect(normalizeAiPolicy({ schema: 'cloud', data: 'cloud', other: 'x' })).toEqual({
      schema: 'cloud',
      data: 'cloud',
    })
  })

  test('the defaults object is not shared', () => {
    const policy = normalizeAiPolicy(undefined)
    policy.schema = 'off'
    expect(defaultAiPolicy.schema).toBe('cloud')
  })
})

describe('getEffectiveAiPolicy', () => {
  const pairs = aiPolicyLevels.flatMap((surveyLevel) =>
    aiPolicyLevels.map((ceiling) => [surveyLevel, ceiling] as const)
  )

  test.each(pairs)('survey %s with ceiling %s → the stricter one', (surveyLevel, ceiling) => {
    const expected = getPolicyLevelIndex(surveyLevel) <= getPolicyLevelIndex(ceiling) ? surveyLevel : ceiling
    const effective = getEffectiveAiPolicy({
      policy: { schema: surveyLevel, data: surveyLevel },
      ceilings: { schema: ceiling, data: ceiling },
    })
    expect(effective).toEqual({ schema: expected, data: expected })
  })

  test('the classes are independent', () => {
    expect(
      getEffectiveAiPolicy({
        policy: { schema: 'cloud', data: 'cloud' },
        ceilings: { schema: 'orgHosted', data: 'off' },
      })
    ).toEqual({ schema: 'orgHosted', data: 'off' })
  })

  test('an invalid level on either side becomes off', () => {
    expect(
      getEffectiveAiPolicy({
        policy: { schema: 'x' as any, data: 'cloud' },
        ceilings: { schema: 'cloud', data: 'y' as any },
      })
    ).toEqual({ schema: 'off', data: 'off' })
  })

  test('clampAiPolicy is the same operation', () => {
    const args = {
      policy: { schema: 'cloud', data: 'orgHosted' } as const,
      ceilings: { schema: 'onDevice', data: 'cloud' } as const,
    }
    expect(clampAiPolicy(args)).toEqual(getEffectiveAiPolicy(args))
  })
})

describe('isHostingAllowed: full matrix', () => {
  const cases = aiPolicyLevels.flatMap((level) =>
    aiHostingClasses.flatMap((hostingClass) =>
      (['schema', 'data'] as const).map((dataClass) => [level, hostingClass, dataClass] as const)
    )
  )

  test.each(cases)('effective %s, hosting %s, class %s', (level, hostingClass, dataClass) => {
    const effective = { schema: 'off', data: 'off', [dataClass]: level } as any
    const expected = level !== 'off' && getPolicyLevelIndex(hostingClass) <= getPolicyLevelIndex(level)
    expect(isHostingAllowed({ effective, dataClass, hostingClass })).toBe(expected)
  })

  test('off allows nothing', () => {
    for (const hostingClass of aiHostingClasses) {
      expect(isHostingAllowed({ effective: { schema: 'off', data: 'off' }, dataClass: 'schema', hostingClass })).toBe(
        false
      )
    }
  })

  test('null, unknown hosting classes and unknown data classes are refused', () => {
    const effective = { schema: 'cloud', data: 'cloud' } as const
    expect(isHostingAllowed({ effective, dataClass: 'schema', hostingClass: null })).toBe(false)
    expect(isHostingAllowed({ effective, dataClass: 'schema', hostingClass: 'off' })).toBe(false)
    expect(isHostingAllowed({ effective, dataClass: 'schema', hostingClass: 'external' })).toBe(false)
    expect(isHostingAllowed({ effective, dataClass: 'records', hostingClass: 'cloud' })).toBe(false)
  })
})

describe('assertHostingAllowed', () => {
  test('passes when allowed', () => {
    expect(() =>
      assertHostingAllowed({
        effective: { schema: 'cloud', data: 'onDevice' },
        dataClass: 'schema',
        hostingClass: 'cloud',
      })
    ).not.toThrow()
  })

  test('throws aiPolicyRefused (403) with the params', async () => {
    const error: any = await expectSystemErrorKey(
      () =>
        assertHostingAllowed({
          effective: { schema: 'cloud', data: 'onDevice' },
          dataClass: 'data',
          hostingClass: 'cloud',
        }),
      'aiPolicyRefused'
    )
    expect(error.statusCode).toBe(403)
    expect(error.params).toEqual({ dataClass: 'data', hostingClass: 'cloud', allowed: 'onDevice' })
  })

  test('a null hosting class is reported as unknown', async () => {
    const error: any = await expectSystemErrorKey(
      () =>
        assertHostingAllowed({
          effective: { schema: 'cloud', data: 'cloud' },
          dataClass: 'schema',
          hostingClass: null,
        }),
      'aiPolicyRefused'
    )
    expect(error.params.hostingClass).toBe('unknown')
  })
})

describe('findLevelsAboveCeiling', () => {
  test('lists the classes above their ceiling', () => {
    const ceilings = { schema: 'orgHosted', data: 'onDevice' } as const
    expect(findLevelsAboveCeiling({ policy: { schema: 'cloud', data: 'onDevice' }, ceilings })).toEqual(['schema'])
    expect(findLevelsAboveCeiling({ policy: { schema: 'cloud', data: 'cloud' }, ceilings })).toEqual(['schema', 'data'])
    expect(findLevelsAboveCeiling({ policy: { schema: 'off', data: 'off' }, ceilings })).toEqual([])
  })
})
