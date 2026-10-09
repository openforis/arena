import type { User } from '@openforis/arena-core'

import { getEngineSettingsFields } from '@server/modules/ai/service/engineSettings'
import { isCapabilityStatsEnabledForUser, resolveCapabilityStatsUpdate } from '@server/modules/ai/service/aiUserPrefs'

const userWithAi = (ai: object | undefined): User => ({ uuid: 'u1', prefs: ai ? { ai } : {} }) as unknown as User

describe('getEngineSettingsFields', () => {
  test('returns the allowlist, the normalized ceilings and the prompt cap', () => {
    const fields = getEngineSettingsFields({
      aiOrgHostedBaseUrls: ['http://10.0.0.5:8000/v1'],
      aiPolicyMaxSchema: 'cloud',
      aiPolicyMaxData: 'orgHosted',
      aiMaxPromptChars: 1234,
    })
    expect(fields).toEqual({
      orgHostedBaseUrls: ['http://10.0.0.5:8000/v1'],
      policyCeilings: { schema: 'cloud', data: 'orgHosted' },
      maxPromptChars: 1234,
    })
  })

  test('an invalid ceiling is off (fails closed)', () => {
    const fields = getEngineSettingsFields({
      aiOrgHostedBaseUrls: [],
      aiPolicyMaxSchema: 'everywhere',
      aiPolicyMaxData: undefined,
      aiMaxPromptChars: 10,
    })
    expect(fields.policyCeilings.schema).toBe('off')
    // B's rule: an unset ceiling is cloud
    expect(fields.policyCeilings.data).toBe('cloud')
  })

  test('returns a copy of the allowlist', () => {
    const env = {
      aiOrgHostedBaseUrls: ['http://a/v1'],
      aiPolicyMaxSchema: 'cloud',
      aiPolicyMaxData: 'cloud',
      aiMaxPromptChars: 1,
    }
    getEngineSettingsFields(env).orgHostedBaseUrls.push('http://b/v1')
    expect(env.aiOrgHostedBaseUrls).toEqual(['http://a/v1'])
  })
})

describe('capabilityStats preference', () => {
  test('is off by default', () => {
    expect(isCapabilityStatsEnabledForUser(userWithAi(undefined))).toBe(false)
    expect(isCapabilityStatsEnabledForUser(userWithAi({ featuresEnabled: true }))).toBe(false)
    expect(isCapabilityStatsEnabledForUser(userWithAi({ capabilityStats: 'yes' }))).toBe(false)
  })

  test('is on only when stored as true', () => {
    expect(isCapabilityStatsEnabledForUser(userWithAi({ capabilityStats: true }))).toBe(true)
  })

  test('an update with a boolean wins, otherwise the stored value is kept', () => {
    expect(resolveCapabilityStatsUpdate({ existing: null, update: { capabilityStats: true } })).toBe(true)
    expect(
      resolveCapabilityStatsUpdate({ existing: { capabilityStats: true }, update: { capabilityStats: false } })
    ).toBe(false)
    expect(resolveCapabilityStatsUpdate({ existing: { capabilityStats: true }, update: {} })).toBe(true)
    expect(
      resolveCapabilityStatsUpdate({ existing: { capabilityStats: true }, update: { capabilityStats: 'no' } })
    ).toBe(true)
    expect(resolveCapabilityStatsUpdate({ existing: null, update: null })).toBe(false)
  })
})
