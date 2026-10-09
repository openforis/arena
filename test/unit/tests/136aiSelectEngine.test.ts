import type { AiDataClass } from '@common/ai/features'
import type { AiPolicy } from '@common/ai/policy'
import { isPolicyReason, selectEngine } from '@webapp/ai/engines/selectEngine'
import type { AiCapabilities, AiEngineSelection } from '@webapp/ai/engines/types'

const LEVELS = ['off', 'onDevice', 'orgHosted', 'cloud'] as const
type Level = (typeof LEVELS)[number]
const LOCAL_STATES = ['off', 'unreachable', 'noModel', 'onDevice', 'orgHosted', 'cloud'] as const
type LocalState = (typeof LOCAL_STATES)[number]
const GATEWAY_STATES = ['none', 'orgHosted', 'cloud'] as const
type GatewayState = (typeof GATEWAY_STATES)[number]
const DATA_CLASSES: AiDataClass[] = ['schema', 'data']

const isHostingClass = (state: string): state is 'onDevice' | 'orgHosted' | 'cloud' =>
  state === 'onDevice' || state === 'orgHosted' || state === 'cloud'

const capabilitiesFor = (local: LocalState, gateway: GatewayState): AiCapabilities => ({
  localServer: {
    enabled: local !== 'off',
    reachable: local === 'off' ? null : local !== 'unreachable',
    models: local === 'noModel' ? ['another-model'] : ['local-model'],
    hostingClass: isHostingClass(local) ? local : 'onDevice',
    contextTokens: 8192,
    baseUrl: 'http://localhost:1234/v1',
    modelId: 'local-model',
    error: null,
  },
  gateway: {
    available: gateway !== 'none',
    hostingClass: gateway === 'none' ? null : gateway,
    provider: gateway === 'none' ? null : 'openai',
    model: gateway === 'none' ? null : 'gateway-model',
    maxPromptChars: 200000,
  },
  device: { webGpu: false, deviceMemoryGb: null, promptApi: null },
  instance: { policyCeilings: { schema: 'cloud', data: 'cloud' }, orgHostedBaseUrls: [] },
})

// plain oracle, written independently of selectEngine
const RANK: Record<Level, number> = { off: 0, onDevice: 1, orgHosted: 2, cloud: 3 }

const policyReasonOf = (hostingClass: string) =>
  hostingClass === 'cloud'
    ? 'policyForbidsCloud'
    : hostingClass === 'orgHosted'
      ? 'policyForbidsOrgHosted'
      : 'policyForbidsAll'

const oracle = (
  policy: AiPolicy,
  dataClass: AiDataClass,
  local: LocalState,
  gateway: GatewayState,
  preferLocal: boolean
): { engine: string | null; hostingClass: string | null; reasons: string[] } => {
  const allowed = RANK[policy[dataClass] as Level]
  if (allowed === 0) return { engine: null, hostingClass: null, reasons: ['policyForbidsAll'] }

  const localReason: Record<string, string> = {
    off: 'localServerNotEnabled',
    unreachable: 'localServerUnreachable',
    noModel: 'localServerNoModel',
  }
  const entries = [
    {
      engine: 'localServer',
      hostingClass: isHostingClass(local) ? local : null,
      reason: localReason[local] ?? policyReasonOf(local),
    },
    {
      engine: 'gateway',
      hostingClass: gateway === 'none' ? null : gateway,
      reason: gateway === 'none' ? 'gatewayNotConfigured' : policyReasonOf(gateway),
    },
  ]
  const ordered = preferLocal ? entries : [entries[1], entries[0]]
  for (const entry of ordered) {
    if (entry.hostingClass && RANK[entry.hostingClass as Level] <= allowed) {
      return { engine: entry.engine, hostingClass: entry.hostingClass, reasons: [] }
    }
  }
  const reasons: string[] = []
  for (const entry of ordered) if (!reasons.includes(entry.reason)) reasons.push(entry.reason)
  return { engine: null, hostingClass: null, reasons }
}

const summarize = (selection: AiEngineSelection) =>
  'engine' in selection
    ? { engine: selection.engine.id, hostingClass: selection.engine.hostingClass, reasons: [] }
    : { engine: null, hostingClass: null, reasons: selection.unavailable }

describe('selectEngine: every policy × data class × local state × gateway state × preference', () => {
  for (const schema of LEVELS) {
    for (const data of LEVELS) {
      test(`policy schema=${schema} data=${data}`, () => {
        const policy: AiPolicy = { schema, data }
        const mismatches: string[] = []
        for (const dataClass of DATA_CLASSES) {
          for (const local of LOCAL_STATES) {
            for (const gateway of GATEWAY_STATES) {
              for (const preferLocal of [true, false]) {
                const actual = summarize(
                  selectEngine({
                    effective: policy,
                    dataClass,
                    capabilities: capabilitiesFor(local, gateway),
                    prefs: { preferLocal },
                  })
                )
                const expected = oracle(policy, dataClass, local, gateway, preferLocal)
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                  mismatches.push(
                    `${dataClass} local=${local} gateway=${gateway} preferLocal=${preferLocal}: ` +
                      `${JSON.stringify(actual)} != ${JSON.stringify(expected)}`
                  )
                }
              }
            }
          }
        }
        expect(mismatches).toEqual([])
      })
    }
  }
})

describe('selectEngine: examples', () => {
  const defaults: AiPolicy = { schema: 'cloud', data: 'onDevice' }

  test('default policy: the activity log summary (data) runs on the local server', () => {
    const selection = selectEngine({
      effective: defaults,
      dataClass: 'data',
      capabilities: capabilitiesFor('onDevice', 'cloud'),
      prefs: { preferLocal: false },
    })
    expect('engine' in selection && selection.engine).toEqual({
      id: 'localServer',
      hostingClass: 'onDevice',
      label: 'LM Studio',
      model: 'local-model',
      limits: { maxPromptChars: 18432, maxSteps: 6 },
    })
  })

  test('preference only reorders: gateway first when local is not preferred', () => {
    const selection = selectEngine({
      effective: defaults,
      dataClass: 'schema',
      capabilities: capabilitiesFor('onDevice', 'cloud'),
      prefs: { preferLocal: false },
    })
    expect('engine' in selection && selection.engine.id).toBe('gateway')
  })

  test('local off on an onDevice survey: what would fix it', () => {
    const selection = selectEngine({
      effective: defaults,
      dataClass: 'data',
      capabilities: capabilitiesFor('off', 'cloud'),
      prefs: { preferLocal: true },
    })
    expect(selection).toEqual({ unavailable: ['localServerNotEnabled', 'policyForbidsCloud'] })
  })

  test('a reachable server whose chosen model disappeared has no model', () => {
    const selection = selectEngine({
      effective: defaults,
      dataClass: 'data',
      capabilities: capabilitiesFor('noModel', 'none'),
      prefs: { preferLocal: true },
    })
    expect(selection).toEqual({ unavailable: ['localServerNoModel', 'gatewayNotConfigured'] })
  })

  test('isPolicyReason', () => {
    expect(isPolicyReason('policyForbidsCloud')).toBe(true)
    expect(isPolicyReason('policyForbidsAll')).toBe(true)
    expect(isPolicyReason('localServerUnreachable')).toBe(false)
  })
})
