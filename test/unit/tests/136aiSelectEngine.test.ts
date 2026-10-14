import type { AiDataClass } from '@common/ai/features'
import type { AiPolicy } from '@common/ai/policy'
import { isPolicyReason, selectEngine } from '@webapp/ai/engines/selectEngine'
import type {
  AiCapabilities,
  AiEngineSelection,
  AiLocalServerCapability,
  AiProviderEntry,
} from '@webapp/ai/engines/types'

const LEVELS = ['off', 'onDevice', 'orgHosted', 'cloud'] as const
type Level = (typeof LEVELS)[number]
const DATA_CLASSES: AiDataClass[] = ['schema', 'data']
const RANK: Record<Level, number> = { off: 0, onDevice: 1, orgHosted: 2, cloud: 3 }

/** Builds a local server probe result. */
const probe = (overrides: Partial<AiLocalServerCapability> = {}): AiLocalServerCapability => ({
  enabled: true,
  reachable: true,
  models: ['local-model'],
  hostingClass: 'onDevice',
  contextTokens: 8192,
  baseUrl: 'http://localhost:1234/v1',
  modelId: 'local-model',
  error: null,
  ...overrides,
})

/** Builds a provider entry. */
const entry = (overrides: Partial<AiProviderEntry> & Pick<AiProviderEntry, 'id' | 'kind'>): AiProviderEntry => ({
  type: 'openai',
  name: 'Provider',
  model: 'model',
  baseUrl: null,
  hostingClass: 'cloud',
  status: 'ready',
  ...overrides,
})

const ARENA_READY = entry({ id: 'arena-default', kind: 'arenaDefault', name: 'Arena default' })

// the user's default provider in one state, with the facts the oracle reads
type ProviderState = {
  name: string
  id: string
  entry: AiProviderEntry | null // null: not in the list (removed, or a local provider of another browser)
  probe?: AiLocalServerCapability
  hostingClass: Level | null
  usable: boolean
}

/** Builds a local provider entry. */
const localEntry = (id: string, overrides: Partial<AiProviderEntry> = {}) =>
  entry({ id, kind: 'local', type: 'local', model: 'local-model', hostingClass: 'onDevice', ...overrides })

const STATES: ProviderState[] = [
  {
    name: 'account cloud ready',
    id: 'acct:a',
    entry: entry({ id: 'acct:a', kind: 'account' }),
    hostingClass: 'cloud',
    usable: true,
  },
  {
    name: 'account orgHosted not tested',
    id: 'acct:b',
    entry: entry({
      id: 'acct:b',
      kind: 'account',
      type: 'openai-compatible',
      hostingClass: 'orgHosted',
      status: 'notTested',
    }),
    hostingClass: 'orgHosted',
    usable: true,
  },
  {
    name: 'account whose test failed',
    id: 'acct:c',
    entry: entry({ id: 'acct:c', kind: 'account', status: 'notAvailable' }),
    hostingClass: 'cloud',
    usable: false,
  },
  { name: 'account removed', id: 'acct:gone', entry: null, hostingClass: null, usable: false },
  {
    name: 'local on this device',
    id: 'local:a',
    entry: localEntry('local:a'),
    probe: probe(),
    hostingClass: 'onDevice',
    usable: true,
  },
  {
    name: 'local on the organisation network',
    id: 'local:b',
    entry: localEntry('local:b', { hostingClass: 'orgHosted' }),
    probe: probe({ hostingClass: 'orgHosted', baseUrl: 'http://10.0.0.5:8000/v1' }),
    hostingClass: 'orgHosted',
    usable: true,
  },
  {
    name: 'local unreachable',
    id: 'local:c',
    entry: localEntry('local:c', { status: 'notAvailable' }),
    probe: probe({ reachable: false }),
    hostingClass: 'onDevice',
    usable: false,
  },
  { name: 'local of another browser', id: 'local:other', entry: null, hostingClass: null, usable: false },
  { name: 'Arena default ready', id: 'arena-default', entry: ARENA_READY, hostingClass: 'cloud', usable: true },
  {
    name: 'Arena default not set up',
    id: 'arena-default',
    entry: entry({
      id: 'arena-default',
      kind: 'arenaDefault',
      type: 'arena-default',
      model: null,
      hostingClass: null,
      status: 'notSetUp',
    }),
    hostingClass: null,
    usable: false,
  },
]

/** Builds the instance part of the capabilities. */
const baseCapabilities = (): Pick<AiCapabilities, 'instance'> => ({
  instance: { policyCeilings: { schema: 'cloud', data: 'cloud' }, orgHostedBaseUrls: [], maxPromptChars: 200000 },
})

/** Builds the capabilities of a provider state. */
const capabilitiesFor = (state: ProviderState): AiCapabilities => {
  const providers = state.entry ? [state.entry] : []
  // Arena default is always listed: a default that cannot be used must not fall back to it
  if (!providers.some((provider) => provider.id === ARENA_READY.id)) providers.push(ARENA_READY)
  return {
    ...baseCapabilities(),
    providers,
    defaultProviderId: state.id,
    local: state.probe ? { [state.id]: state.probe } : {},
  }
}

// plain oracle, written independently of selectEngine
const oracle = (policy: AiPolicy, dataClass: AiDataClass, state: ProviderState): string => {
  const allowed = RANK[policy[dataClass] as Level]
  if (allowed === 0) return 'policyForbids'
  if (!state.entry) return state.id.startsWith('local:') ? 'missingOnThisBrowser' : 'notAvailable'
  if (state.hostingClass && RANK[state.hostingClass] > allowed) return 'policyForbids'
  if (state.entry.status === 'notSetUp') return 'notSetUp'
  if (!state.usable) return 'notAvailable'
  return `${state.id}@${state.hostingClass}`
}

/** Summarizes a selection as its engine or its reasons. */
const summarize = (selection: AiEngineSelection): string =>
  'engine' in selection
    ? `${selection.engine.providerId}@${selection.engine.hostingClass}`
    : selection.unavailable.join(',')

describe('selectEngine: every policy × data class × default provider state', () => {
  for (const schema of LEVELS) {
    for (const data of LEVELS) {
      test(`policy schema=${schema} data=${data}`, () => {
        const policy: AiPolicy = { schema, data }
        const mismatches: string[] = []
        for (const dataClass of DATA_CLASSES) {
          for (const state of STATES) {
            const capabilities = capabilitiesFor(state)
            const actual = summarize(selectEngine({ effective: policy, dataClass, capabilities }))
            const expected = oracle(policy, dataClass, state)
            if (actual !== expected) mismatches.push(`${dataClass} ${state.name}: ${actual} != ${expected}`)
          }
        }
        expect(mismatches).toEqual([])
      })
    }
  }
})

describe('selectEngine: examples', () => {
  const policy: AiPolicy = { schema: 'cloud', data: 'onDevice' }
  const localState = STATES[4]
  /** Runs the selection with overrides of the default inputs. */
  const run = (overrides: Record<string, unknown>) =>
    selectEngine({
      effective: policy,
      dataClass: 'data',
      capabilities: capabilitiesFor(localState),
      ...overrides,
    } as Parameters<typeof selectEngine>[0])

  test('a local provider: its name as label, the limits from its context', () => {
    const capabilities = capabilitiesFor({ ...localState, entry: localEntry('local:a', { name: 'Desk server' }) })
    const selection = selectEngine({ effective: policy, dataClass: 'data', capabilities })
    expect('engine' in selection && selection.engine).toEqual({
      id: 'localServer',
      hostingClass: 'onDevice',
      label: 'Desk server',
      model: 'local-model',
      limits: { maxPromptChars: 18432, maxSteps: 6 },
      contextWindow: { tokens: 8192, assumed: false },
      providerId: 'local:a',
    })
  })

  test('an account provider: the gateway engine named after the provider, with the instance prompt cap', () => {
    const account = entry({ id: 'acct:a', kind: 'account', name: 'Mine' })
    const capabilities = capabilitiesFor({ ...STATES[0], entry: account })
    const selection = selectEngine({ effective: policy, dataClass: 'schema', capabilities })
    expect('engine' in selection && selection.engine).toEqual({
      id: 'gateway',
      hostingClass: 'cloud',
      label: 'Mine',
      model: 'model',
      limits: { maxPromptChars: 200000, maxSteps: 10 },
      providerId: 'acct:a',
    })
  })

  test('Arena default is named after the admin provider type', () => {
    const selection = selectEngine({ effective: policy, dataClass: 'schema', capabilities: capabilitiesFor(STATES[8]) })
    expect('engine' in selection && selection.engine.label).toBe('openai')
  })

  test("the conversation's provider wins over the default", () => {
    const capabilities = capabilitiesFor(localState)
    const selection = selectEngine({
      effective: policy,
      dataClass: 'schema',
      capabilities,
      providerId: 'arena-default',
    })
    expect('engine' in selection && selection.engine.providerId).toBe('arena-default')
  })

  test('isPolicyReason', () => {
    expect(isPolicyReason('policyForbids')).toBe(true)
    expect(isPolicyReason('notAvailable')).toBe(false)
    expect(isPolicyReason('missingOnThisBrowser')).toBe(false)
  })

  test('null effective policy fails closed', () => {
    expect(run({ effective: null })).toEqual({ unavailable: ['policyForbids'] })
  })

  test('invalid policy level is unavailable', () => {
    expect('unavailable' in run({ effective: { schema: 'bogus', data: 'bogus' } })).toBe(true)
  })

  test('unknown data class is unavailable', () => {
    expect('unavailable' in run({ dataClass: 'other' })).toBe(true)
  })

  test('a local provider not probed yet is not available', () => {
    const capabilities = capabilitiesFor({ ...localState, probe: probe({ reachable: null }) })
    expect(run({ capabilities })).toEqual({ unavailable: ['notAvailable'] })
  })

  test('a local provider whose model disappeared is not available', () => {
    const capabilities = capabilitiesFor({ ...localState, probe: probe({ models: ['another-model'] }) })
    expect(run({ capabilities })).toEqual({ unavailable: ['notAvailable'] })
  })

  test('a local provider without a probe is not available', () => {
    const capabilities = capabilitiesFor({ ...localState, probe: undefined })
    expect(run({ capabilities })).toEqual({ unavailable: ['notAvailable'] })
  })
})
