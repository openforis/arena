import {
  aiPolicyLevels,
  assertHostingAllowed,
  clampDataToSchema,
  getAllowedLevel,
  getEffectiveAiPolicy,
  getPolicyLevelIndex,
  isDataAboveSchema,
  isHostingAllowed,
  normalizeAiPolicy,
} from '@common/ai/policy'
import { parseAiPolicyBody } from '@server/modules/ai/service/surveyAiPolicyService'

import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

const pairs = aiPolicyLevels.flatMap((schema) => aiPolicyLevels.map((data) => [schema, data] as const))
const strictest = (a: string, b: string) => (getPolicyLevelIndex(a) <= getPolicyLevelIndex(b) ? a : b)

describe('policy invariant: data is never more permissive than the survey design (360)', () => {
  test.each(pairs)('normalizeAiPolicy schema=%s data=%s clamps data to the schema level', (schema, data) => {
    expect(normalizeAiPolicy({ schema, data })).toEqual({ schema, data: strictest(schema, data) })
  })

  test('a missing data class gets its default, then the clamp', () => {
    expect(normalizeAiPolicy({ schema: 'off' })).toEqual({ schema: 'off', data: 'off' })
    expect(normalizeAiPolicy({ schema: 'cloud' })).toEqual({ schema: 'cloud', data: 'onDevice' })
  })

  test('an invalid schema level fails closed for both classes', () => {
    expect(normalizeAiPolicy({ schema: 'Cloud', data: 'cloud' })).toEqual({ schema: 'off', data: 'off' })
  })

  test.each(pairs)(
    'getEffectiveAiPolicy keeps the invariant: survey %s/%s with ceilings cloud/cloud',
    (schema, data) => {
      const effective = getEffectiveAiPolicy({
        policy: { schema, data },
        ceilings: { schema: 'cloud', data: 'cloud' },
      })
      expect(effective).toEqual({ schema, data: strictest(schema, data) })
    }
  )

  test('a ceiling on the schema also lowers the data class', () => {
    expect(
      getEffectiveAiPolicy({
        policy: { schema: 'cloud', data: 'cloud' },
        ceilings: { schema: 'orgHosted', data: 'cloud' },
      })
    ).toEqual({ schema: 'orgHosted', data: 'orgHosted' })
  })

  test('clampDataToSchema and isDataAboveSchema', () => {
    expect(clampDataToSchema({ schema: 'off', data: 'cloud' })).toEqual({ schema: 'off', data: 'off' })
    expect(clampDataToSchema({ schema: 'cloud', data: 'onDevice' })).toEqual({ schema: 'cloud', data: 'onDevice' })
    expect(isDataAboveSchema({ schema: 'onDevice', data: 'orgHosted' })).toBe(true)
    expect(isDataAboveSchema({ schema: 'onDevice', data: 'onDevice' })).toBe(false)
    expect(isDataAboveSchema({ schema: 'cloud', data: 'off' })).toBe(false)
  })

  test('getAllowedLevel: the data class is limited by the schema level, an unknown class by nothing', () => {
    expect(getAllowedLevel({ schema: 'off', data: 'cloud' }, 'data')).toBe('off')
    expect(getAllowedLevel({ schema: 'orgHosted', data: 'cloud' }, 'data')).toBe('orgHosted')
    expect(getAllowedLevel({ schema: 'orgHosted', data: 'cloud' }, 'schema')).toBe('orgHosted')
    expect(getAllowedLevel({ schema: 'cloud', data: 'orgHosted' }, 'data')).toBe('orgHosted')
    expect(getAllowedLevel({ schema: 'cloud', data: 'cloud' }, 'records')).toBe('off')
    expect(getAllowedLevel(null, 'data')).toBe('off')
    expect(getAllowedLevel({ schema: 'x', data: 'cloud' } as any, 'data')).toBe('off')
  })

  test('an effective policy that was not clamped (ceilings alone) still refuses a data request above the schema', () => {
    const effective = { schema: 'off', data: 'cloud' } as const
    expect(isHostingAllowed({ effective, dataClass: 'data', hostingClass: 'cloud' })).toBe(false)
    expect(isHostingAllowed({ effective, dataClass: 'data', hostingClass: 'onDevice' })).toBe(false)
    expect(isHostingAllowed({ effective, dataClass: 'schema', hostingClass: 'cloud' })).toBe(false)
  })

  test('data to the cloud needs both classes at the cloud level', () => {
    const effective = { schema: 'orgHosted', data: 'cloud' } as const
    expect(isHostingAllowed({ effective, dataClass: 'data', hostingClass: 'cloud' })).toBe(false)
    expect(isHostingAllowed({ effective, dataClass: 'data', hostingClass: 'orgHosted' })).toBe(true)
  })

  test('the refusal reports the level that applied', async () => {
    const error: any = await expectSystemErrorKey(
      () =>
        assertHostingAllowed({
          effective: { schema: 'onDevice', data: 'cloud' },
          dataClass: 'data',
          hostingClass: 'cloud',
        }),
      'aiPolicyRefused'
    )
    expect(error.params).toEqual({ dataClass: 'data', hostingClass: 'cloud', allowed: 'onDevice' })
  })
})

describe('parseAiPolicyBody: data above schema (360)', () => {
  test.each(pairs.filter(([schema, data]) => getPolicyLevelIndex(data) > getPolicyLevelIndex(schema)))(
    'schema=%s data=%s is rejected with aiPolicyDataAboveSchema (400) and its params',
    async (schema, data) => {
      const error: any = await expectSystemErrorKey(
        () => parseAiPolicyBody({ schema, data }),
        'aiPolicyDataAboveSchema'
      )
      expect(error.statusCode).toBe(400)
      expect(error.params).toEqual({ schema, data })
    }
  )

  test.each(pairs.filter(([schema, data]) => getPolicyLevelIndex(data) <= getPolicyLevelIndex(schema)))(
    'schema=%s data=%s is accepted',
    (schema, data) => {
      expect(parseAiPolicyBody({ schema, data })).toEqual({ schema, data })
    }
  )

  test('an unknown level is still aiPolicyInvalid', async () => {
    await expectSystemErrorKey(() => parseAiPolicyBody({ schema: 'cloud', data: 'quantum' }), 'aiPolicyInvalid')
  })
})
