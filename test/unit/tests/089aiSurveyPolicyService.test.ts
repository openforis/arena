import * as ActivityLog from '@common/activityLog/activityLog'
import {
  getSurveyAiPolicy,
  parseAiPolicyBody,
  updateSurveyAiPolicy,
  type SurveyAiPolicyDeps,
} from '@server/modules/ai/service/surveyAiPolicyService'

import { expectSystemErrorKey } from '@test/unit/utils/aiTestUtils'

const user: any = { uuid: 'admin-1' }

const createDeps = ({ stored = null as unknown, ceilings = { schema: 'cloud', data: 'cloud' } as any } = {}) => {
  const state = { stored, activities: [] as any[], stores: [] as any[], clients: [] as unknown[] }
  const deps: SurveyAiPolicyDeps = {
    fetchRawPolicy: async (_surveyId, client) => {
      state.clients.push(client)
      return state.stored
    },
    storePolicy: async ({ surveyId, policy }, client) => {
      state.clients.push(client)
      state.stores.push({ surveyId, policy })
      state.stored = policy
    },
    insertActivityLog: async ({ user: actor, surveyId, content }, client) => {
      state.clients.push(client)
      state.activities.push({ userUuid: actor.uuid, surveyId, content })
    },
    getCeilings: () => ceilings,
    runInTransaction: async (fn) => fn('tx'),
  }
  return { deps, state }
}

describe('parseAiPolicyBody', () => {
  test('accepts the two classes with valid levels', () => {
    expect(parseAiPolicyBody({ schema: 'orgHosted', data: 'off' })).toEqual({ schema: 'orgHosted', data: 'off' })
  })

  test.each([
    ['unknown level', { schema: 'cloud', data: 'everywhere' }],
    ['missing class', { schema: 'cloud' }],
    ['not an object', 'cloud'],
    ['null', null],
    ['array', ['cloud', 'cloud']],
  ])('rejects %s with aiPolicyInvalid (400)', async (_label, body) => {
    const error: any = await expectSystemErrorKey(() => parseAiPolicyBody(body), 'aiPolicyInvalid')
    expect(error.statusCode).toBe(400)
  })
})

describe('getSurveyAiPolicy', () => {
  test('a survey without a policy gets the defaults', async () => {
    const { deps } = createDeps()
    expect(await getSurveyAiPolicy(3, deps)).toEqual({
      policy: { schema: 'cloud', data: 'onDevice' },
      ceilings: { schema: 'cloud', data: 'cloud' },
      effective: { schema: 'cloud', data: 'onDevice' },
    })
  })

  test('the effective policy is clamped to the ceilings', async () => {
    const { deps } = createDeps({
      stored: { schema: 'cloud', data: 'cloud' },
      ceilings: { schema: 'orgHosted', data: 'off' },
    })
    const result = await getSurveyAiPolicy(3, deps)
    expect(result.policy).toEqual({ schema: 'cloud', data: 'cloud' })
    expect(result.effective).toEqual({ schema: 'orgHosted', data: 'off' })
  })
})

describe('updateSurveyAiPolicy', () => {
  test('stores the policy and logs the change with from/to, in one transaction', async () => {
    const { deps, state } = createDeps()
    const result = await updateSurveyAiPolicy({ user, surveyId: 3, policy: { schema: 'cloud', data: 'cloud' } }, deps)
    expect(state.stores).toEqual([{ surveyId: 3, policy: { schema: 'cloud', data: 'cloud' } }])
    expect(state.activities).toEqual([
      {
        userUuid: 'admin-1',
        surveyId: 3,
        content: { from: { schema: 'cloud', data: 'onDevice' }, to: { schema: 'cloud', data: 'cloud' } },
      },
    ])
    expect(state.clients.every((client) => client === 'tx')).toBe(true)
    expect(result).toEqual({
      policy: { schema: 'cloud', data: 'cloud' },
      ceilings: { schema: 'cloud', data: 'cloud' },
      effective: { schema: 'cloud', data: 'cloud' },
    })
  })

  test('no activity entry when nothing changes', async () => {
    const { deps, state } = createDeps({ stored: { schema: 'off', data: 'onDevice' } })
    await updateSurveyAiPolicy({ user, surveyId: 3, policy: { schema: 'off', data: 'onDevice' } }, deps)
    expect(state.activities).toEqual([])
  })

  test('a level above the ceiling is rejected with aiPolicyAboveCeiling (400) and nothing is stored', async () => {
    const { deps, state } = createDeps({ ceilings: { schema: 'cloud', data: 'orgHosted' } })
    const error: any = await expectSystemErrorKey(
      updateSurveyAiPolicy({ user, surveyId: 3, policy: { schema: 'cloud', data: 'cloud' } }, deps),
      'aiPolicyAboveCeiling'
    )
    expect(error.statusCode).toBe(400)
    expect(error.params).toEqual({ dataClass: 'data', level: 'cloud', ceiling: 'orgHosted' })
    expect(state.stores).toEqual([])
  })

  test('an unknown level is rejected as invalid, not passed to the ceiling check, even with the strictest ceilings', async () => {
    const { deps, state } = createDeps({ ceilings: { schema: 'off', data: 'off' } })
    const error: any = await expectSystemErrorKey(
      updateSurveyAiPolicy({ user, surveyId: 3, policy: { schema: 'cloud', data: 'quantum' } }, deps),
      'aiPolicyInvalid'
    )
    expect(error.statusCode).toBe(400)
    expect(state.stores).toEqual([])
  })

  test('an invalid body is rejected before anything is read', async () => {
    const { deps, state } = createDeps()
    await expectSystemErrorKey(
      updateSurveyAiPolicy({ user, surveyId: 3, policy: { schema: 'x', data: 'off' } }, deps),
      'aiPolicyInvalid'
    )
    expect(state.clients).toEqual([])
  })
})

describe('activity log type', () => {
  test('surveyAiPolicyUpdate exists', () => {
    expect(ActivityLog.type.surveyAiPolicyUpdate).toBe('surveyAiPolicyUpdate')
  })
})
