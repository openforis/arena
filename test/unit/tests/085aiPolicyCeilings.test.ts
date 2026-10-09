import { getAiPolicyCeilingErrors, getAiPolicyCeilings } from '@server/modules/ai/service/policyCeilings'

describe('getAiPolicyCeilings', () => {
  test('defaults to cloud when unset or empty', () => {
    expect(getAiPolicyCeilings({})).toEqual({ schema: 'cloud', data: 'cloud' })
    expect(getAiPolicyCeilings({ aiPolicyMaxSchema: '', aiPolicyMaxData: '  ' })).toEqual({ schema: 'cloud', data: 'cloud' })
  })

  test('reads valid levels (trimmed)', () => {
    expect(getAiPolicyCeilings({ aiPolicyMaxSchema: 'orgHosted', aiPolicyMaxData: ' off ' })).toEqual({
      schema: 'orgHosted',
      data: 'off',
    })
  })

  test('invalid values become off', () => {
    expect(getAiPolicyCeilings({ aiPolicyMaxSchema: 'CLOUD', aiPolicyMaxData: 'local' })).toEqual({
      schema: 'off',
      data: 'off',
    })
  })
})

describe('getAiPolicyCeilingErrors', () => {
  test('no errors for valid or unset values', () => {
    expect(getAiPolicyCeilingErrors({})).toEqual([])
    expect(getAiPolicyCeilingErrors({ aiPolicyMaxSchema: 'cloud', aiPolicyMaxData: 'onDevice' })).toEqual([])
  })

  test('one message per invalid variable, naming it', () => {
    const errors = getAiPolicyCeilingErrors({ aiPolicyMaxSchema: 'x', aiPolicyMaxData: 'local' })
    expect(errors).toHaveLength(2)
    expect(errors[0]).toContain('AI_POLICY_MAX_SCHEMA')
    expect(errors[0]).toContain('"x"')
    expect(errors[1]).toContain('AI_POLICY_MAX_DATA')
    expect(errors[1]).toContain('off')
  })
})
